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
    logger: false,
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
            await client.mailboxOpen("INBOX");
            
            // Busca APENAS e-mails não lidos
            const uids = await client.search({ seen: false });

            if (uids.length > 0) {
                // Pega no máximo os 50 mais recentes para não estourar a memória
                const recentUids = uids.slice(-50);
                console.log(`Baixando ${recentUids.length} e-mails (de ${uids.length} não lidos)...`);

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

        // FASE 2: Processamento Offline (Sem risco de Timeout do E-mail)
        if (rawMessages.length > 0) {
            const allCategories = await prisma.category.findMany();
            let category = allCategories.find(c => c.name === "Sincronizado");
            if (!category) {
                category = await prisma.category.create({
                    data: { name: "Sincronizado", color: "#94a3b8", icon: "ArrowLeftRight" }
                });
            }

            for (const rawMsg of rawMessages) {
                const parsed = await simpleParser(rawMsg.source);
                let body = parsed.text || "";
                if (!body && parsed.html) {
                    body = parsed.html.replace(/<[^>]*>?/gm, " "); 
                }
                
                if (body.includes("99Pay") || parsed.subject?.includes("99Pay")) {
                    const amountMatch = body.match(/Valor:\s*R\$?\s*([\d,.]+)/i);
                    const recipientMatch = body.match(/Para:\s*([\d.\s]*)(.*)/i);
                    const externalIdMatch = body.match(/Código da transação:\s*(\w+)/i);
                    const dateMatch = body.match(/Data:\s*([\d/: ]+)/i);

                    if (amountMatch && amountMatch[1] && externalIdMatch && externalIdMatch[1]) {
                        const rawAmount = String(amountMatch[1]).replace(/\./g, "").replace(",", ".");
                        const amount = parseFloat(rawAmount) || 0;
                        const externalId = String(externalIdMatch[1]);
                        const recipient = recipientMatch?.[2] ? String(recipientMatch[2]).trim() : "99Pay";
                        const date = dateMatch ? parseDate(dateMatch[1]) : new Date();

                        const payload = {
                            description: `PIX para ${recipient}`.substring(0, 200),
                            amount,
                            date,
                            type: "EXPENSE",
                            paid: true,
                            externalId,
                            categoryId: category.id,
                        };

                        try {
                            await prisma.transaction.upsert({
                                where: { externalId },
                                update: {}, 
                                create: payload
                            });
                            syncedCount++;
                            uidsToMarkAsSeen.push(rawMsg.uid);
                            console.log(`Sucesso: PIX de ${amount} para ${recipient} salvo.`);
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
