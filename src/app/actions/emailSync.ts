"use server";

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Configurações do Servidor IMAP (Configurável via .env)
const imapConfig = {
    host: process.env.EMAIL_IMAP_HOST || "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
    },
    logger: false as const,
};

/**
 * Sincroniza transações a partir dos e-mails da 99Pay.
 */
export async function syncEmails() {
    if (!imapConfig.auth.user || !imapConfig.auth.pass) {
        return { success: false, error: "E-mail ou senha de app não configurados no .env" };
    }

    console.log("Iniciando sincronização...");
    await prisma.$connect();
    
    const client = new ImapFlow(imapConfig);
    let syncedCount = 0;
    const rawMessages: any[] = [];
    const uidsToMarkAsSeen: number[] = [];

    try {
        // FASE 1: Download Rápido
        await client.connect();
        let lock = await client.getMailboxLock("INBOX");
        try {
            const uids = await client.search({ seen: false });

            if (uids && uids.length > 0) {
                const recentUids = uids.slice(-50);

                // Baixa apenas o texto bruto o mais rápido possível para não dar timeout
                for await (let message of client.fetch(recentUids, { source: true, flags: true })) {
                    rawMessages.push({
                        uid: message.uid,
                        source: message.source
                    });
                }
            }
        } finally {
            lock.release();
        }
        await client.logout();
        
        console.log(`Download concluído. Processando ${rawMessages.length} e-mails offline...`);

        // Busca ou cria a Conta "99 Pay"
        const allAccounts = await prisma.account.findMany();
        let account99 = allAccounts.find(a => a.name.toLowerCase().includes("99"));
        if (!account99) {
            account99 = await prisma.account.create({
                data: { name: "99 Pay", type: "CONTA", includeInTotal: true }
            });
        }

        // Busca ou cria a Categoria "Sincronizado"
        const allCategories = await prisma.category.findMany();
        let category = allCategories.find(c => c.name === "Sincronizado");
        if (!category) {
            category = await prisma.category.create({
                data: { name: "Sincronizado", color: "#94a3b8", icon: "ArrowLeftRight" }
            });
        }

        // Garante que todas as transações já sincronizadas anteriormente fiquem atreladas à conta 99
        await prisma.transaction.updateMany({
            where: {
                OR: [
                    { externalId: { not: null } },
                    { categoryId: category.id }
                ]
            },
            data: {
                accountId: account99.id
            }
        });

        // FASE 2: Processamento Offline (Sem risco de Timeout do E-mail)
        if (rawMessages.length > 0) {
            for (const rawMsg of rawMessages) {
                const parsed = await simpleParser(rawMsg.source);
                let body = parsed.text || "";
                if (!body && parsed.html) {
                    body = parsed.html.replace(/<[^>]*>?/gm, " "); 
                }
                
                const subject = parsed.subject || "";
                const from = parsed.from?.text || "";

                if (body.includes("99Pay") || subject.includes("99") || from.includes("99")) {
                    let amount = 0;
                    let description = "";
                    let externalId = "";
                    let date = parsed.date ? new Date(parsed.date) : new Date();
                    let type = "EXPENSE";
                    let matched = false;

                    // Padrão 1: PIX / Comprovante detalhado (Valor: R$..., Para:..., Código da transação:...)
                    const amountMatch = body.match(/Valor:\s*R\$?\s*([\d,.]+)/i);
                    const recipientMatch = body.match(/Para:\s*([\d.\s]*)(.*)/i);
                    const externalIdMatch = body.match(/(?:Código da transação|ID do pedido):\s*([a-zA-Z0-9_-]+)/i);
                    const dateMatch = body.match(/Data:\s*([\d/: ]+)/i);

                    if (amountMatch && amountMatch[1]) {
                        const rawAmount = String(amountMatch[1]).replace(/\./g, "").replace(",", ".");
                        amount = parseFloat(rawAmount) || 0;
                        const recipient = recipientMatch?.[2] ? String(recipientMatch[2]).trim() : "99Pay";
                        description = `PIX para ${recipient}`.substring(0, 200);
                        externalId = externalIdMatch ? String(externalIdMatch[1]) : `99PIX_${parsed.messageId || rawMsg.uid}_${amount}`;
                        if (dateMatch) date = parseDate(dateMatch[1]);
                        matched = amount > 0;
                    } 
                    // Padrão 2: Corridas 99 e Pagamentos Diretos ("Corrida 99 paga com sucesso via 99Pay, no total de R$21,84.")
                    else {
                        const corridaMatch = body.match(/(?:Corrida 99|Pagamento) pag[oa] com sucesso via 99Pay, no total de R\$?\s*([\d,.]+)/i)
                                          || body.match(/no total de R\$?\s*([\d,.]+)/i)
                                          || body.match(/no valor de R\$?\s*([\d,.]+)/i);

                        if (corridaMatch && corridaMatch[1]) {
                            const rawAmount = String(corridaMatch[1]).replace(/\./g, "").replace(",", ".");
                            amount = parseFloat(rawAmount) || 0;
                            description = body.includes("Corrida 99") ? "Corrida 99" : "Pagamento 99Pay";
                            const cleanMsgId = (parsed.messageId || String(rawMsg.uid)).replace(/[^a-zA-Z0-9]/g, "");
                            externalId = `99RIDE_${cleanMsgId}_${amount}`;
                            matched = amount > 0;
                        }
                    }

                    if (matched && externalId && amount > 0) {
                        const payload = {
                            description,
                            amount,
                            date,
                            type,
                            paid: true,
                            externalId,
                            categoryId: category.id,
                            accountId: account99.id,
                        };

                        try {
                            await prisma.transaction.upsert({
                                where: { externalId },
                                update: {
                                    accountId: account99.id,
                                    categoryId: category.id,
                                }, 
                                create: payload
                            });
                            syncedCount++;
                            uidsToMarkAsSeen.push(rawMsg.uid);
                            console.log(`Sucesso: ${description} de R$${amount} salvo na conta 99 (ID: ${externalId}).`);
                        } catch (dbError) {
                            console.error("Erro ao salvar no banco:", dbError);
                        }
                    }
                }
            }
        }

        // FASE 3: Marcar como Lido (Reconecta rapidamente apenas para isso)
        if (uidsToMarkAsSeen.length > 0) {
            console.log(`Marcando ${uidsToMarkAsSeen.length} e-mails como lidos no servidor...`);
            const updateClient = new ImapFlow(imapConfig);
            await updateClient.connect();
            let updateLock = await updateClient.getMailboxLock("INBOX");
            try {
                // messageFlagsAdd aceita um array de UIDs
                await updateClient.messageFlagsAdd(uidsToMarkAsSeen, ["\\Seen"], { uid: true });
            } finally {
                updateLock.release();
            }
            await updateClient.logout();
        }
        
        revalidatePath("/");
        revalidatePath("/transactions");
        return { success: true, count: syncedCount };

    } catch (error: any) {
        console.error("Erro na sincronização IMAP:", error);
        return { success: false, error: "Falha ao conectar ou ler e-mails." };
    }
}

/**
 * Helper para converter o formato de data da 99Pay (26/05/26 13:32:20)
 */
function parseDate(dateStr: string): Date {
    try {
        if (!dateStr) return new Date();
        const parts = dateStr.trim().split(" ");
        if (parts.length !== 2) return new Date();
        
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split("/");
        
        if (!day || !month || !year) return new Date();

        const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
        
        // Verifica se timePart tem os segundos
        const safeTimePart = timePart.length >= 5 ? timePart : "00:00:00";

        const finalDate = new Date(`${fullYear}-${month}-${day}T${safeTimePart}`);
        
        // Se a data for inválida, retorna a data atual
        if (isNaN(finalDate.getTime())) {
            return new Date();
        }
        
        return finalDate;
    } catch (e) {
        return new Date();
    }
}
