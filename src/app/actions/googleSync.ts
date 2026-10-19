"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export interface BankSyncRule {
  id: string;
  email: string;
  accountId: string;
}

/**
 * Retorna as configurações de integração com o Google do usuário atual.
 */
export async function getUserGoogleSettings() {
  const userId = await getCurrentUserId();
  const [user, accounts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleEmail: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        bankSenderEmail: true,
        bankSyncAccountId: true,
        bankSyncRules: true,
      },
    }),
    prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  let rules: BankSyncRule[] = [];
  if (user?.bankSyncRules) {
    try {
      const parsed = JSON.parse(user.bankSyncRules);
      if (Array.isArray(parsed)) {
        rules = parsed
          .filter((r) => r && typeof r.email === "string" && r.email.trim())
          .map((r, i) => ({
            id: r.id || `rule-${i + 1}`,
            email: r.email.trim(),
            accountId: r.accountId || "",
          }));
      }
    } catch {
      // Ignora erro de JSON corrompido
    }
  }

  // Fallback se não há regras cadastradas mas existe o remetente legadário
  if (rules.length === 0 && user?.bankSenderEmail) {
    rules = [
      {
        id: "rule-1",
        email: user.bankSenderEmail.trim(),
        accountId: user.bankSyncAccountId || "",
      },
    ];
  }

  return {
    isConnected: Boolean(user?.googleAccessToken || user?.googleRefreshToken),
    googleEmail: user?.googleEmail || null,
    bankSenderEmail: user?.bankSenderEmail || null,
    bankSyncAccountId: user?.bankSyncAccountId || null,
    bankSyncRules: rules,
    availableAccounts: accounts,
  };
}

/**
 * Salva as regras de sincronização bancária (múltiplos remetentes e suas respectivas contas).
 */
export async function saveBankSyncRules(rules: { id?: string; email: string; accountId?: string }[]) {
  const userId = await getCurrentUserId();
  const cleaned: BankSyncRule[] = rules
    .map((r, idx) => ({
      id: r.id || `rule-${Date.now()}-${idx}`,
      email: (r.email || "").trim().toLowerCase(),
      accountId: (r.accountId || "").trim(),
    }))
    .filter((r) => r.email.length > 0);

  const primary = cleaned[0];

  await prisma.user.update({
    where: { id: userId },
    data: {
      bankSyncRules: JSON.stringify(cleaned),
      bankSenderEmail: primary ? primary.email : null,
      bankSyncAccountId: primary ? primary.accountId || null : null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
}

/**
 * Salva o e-mail do remetente do banco (mantido para compatibilidade).
 */
export async function saveBankSenderEmail(senderEmail: string, accountId?: string) {
  return saveBankSyncRules([{ email: senderEmail, accountId }]);
}

/**
 * Desconecta a conta do Google do usuário atual.
 */
export async function disconnectGoogle() {
  const userId = await getCurrentUserId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleEmail: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

/**
 * Garante um token de acesso válido, renovando pelo refresh_token caso tenha expirado.
 */
async function getValidAccessToken(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user?.googleAccessToken && !user?.googleRefreshToken) {
    return null;
  }

  const isExpired = user.googleTokenExpiry
    ? new Date().getTime() >= new Date(user.googleTokenExpiry).getTime() - 60000
    : false;

  // Se o token ainda é válido, retorna diretamente
  if (user.googleAccessToken && !isExpired) {
    return user.googleAccessToken;
  }

  // Se expirou mas temos o refresh_token, renova
  if (user.googleRefreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Credenciais do Google Cloud ausentes no servidor.");
    }

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: user.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    const refreshData = await refreshRes.json();
    if (!refreshRes.ok || !refreshData.access_token) {
      throw new Error("Falha ao renovar conexão com o Google. Reconecte sua conta.");
    }

    const newExpiry = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: refreshData.access_token,
        googleTokenExpiry: newExpiry,
      },
    });

    return refreshData.access_token;
  }

  return user.googleAccessToken;
}

/**
 * Decodifica o texto em Base64URL retornado pela API do Gmail.
 */
function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Extrai recursivamente o corpo em texto/html da mensagem do Gmail.
 */
function extractBody(payload: any): string {
  if (!payload) return "";

  let combined = "";

  function walk(part: any) {
    if (!part) return;
    if (part.body && part.body.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (decoded) combined += " " + decoded;
    }
    if (part.parts && Array.isArray(part.parts)) {
      for (const p of part.parts) {
        walk(p);
      }
    }
  }

  walk(payload);
  return combined;
}

/**
 * Converte data de texto para Date.
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
    const safeTimePart = timePart.length >= 5 ? timePart : "00:00:00";
    const finalDate = new Date(`${fullYear}-${month}-${day}T${safeTimePart}`);
    return isNaN(finalDate.getTime()) ? new Date() : finalDate;
  } catch {
    return new Date();
  }
}

/**
 * Sincroniza e-mails da conta Google do usuário logado via Gmail REST API oficial.
 * Processa todos os remetentes configurados nas regras do usuário.
 */
export async function syncGoogleEmails() {
  const userId = await getCurrentUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      bankSenderEmail: true,
      bankSyncAccountId: true,
      bankSyncRules: true,
    },
  });

  if (!user?.googleAccessToken && !user?.googleRefreshToken) {
    return { success: false, error: "Você ainda não conectou sua conta do Google em 'Meu Perfil'." };
  }

  // 1. Obtém as regras configuradas (múltiplos remetentes)
  let rules: BankSyncRule[] = [];
  if (user.bankSyncRules) {
    try {
      const parsed = JSON.parse(user.bankSyncRules);
      if (Array.isArray(parsed)) {
        rules = parsed.filter((r) => r && typeof r.email === "string" && r.email.trim());
      }
    } catch {
      // Ignora erro de JSON
    }
  }

  if (rules.length === 0 && user.bankSenderEmail?.trim()) {
    rules = [
      {
        id: "default",
        email: user.bankSenderEmail.trim(),
        accountId: user.bankSyncAccountId || "",
      },
    ];
  }

  if (rules.length === 0) {
    return { success: false, error: "Por favor, cadastre ao menos um e-mail de remetente bancário no seu perfil." };
  }

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return { success: false, error: "Não foi possível autenticar com o Google. Tente reconectar sua conta." };
  }

  try {
    // Busca ou cria a categoria "Sincronizado"
    let category = await prisma.category.findFirst({
      where: { name: "Sincronizado" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Sincronizado", color: "#94a3b8", icon: "ArrowLeftRight" },
      });
    }

    let totalSyncedCount = 0;
    let totalMessagesFound = 0;
    const processedMsgIds = new Set<string>();
    const detailsPerAccount: { [accountName: string]: number } = {};

    // 2. Itera sobre cada remetente configurado
    for (const rule of rules) {
      const senderFilter = rule.email.trim();
      if (!senderFilter) continue;

      // Define a conta de destino para este remetente específico
      let account = null;
      if (rule.accountId) {
        account = await prisma.account.findUnique({
          where: { id: rule.accountId, userId },
        });
      }

      if (!account) {
        let accountName = "99 Pay";
        if (!senderFilter.includes("99")) {
          const cleanName = senderFilter.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
          accountName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }

        account = await prisma.account.findFirst({
          where: {
            userId,
            name: { contains: accountName.slice(0, 4), mode: "insensitive" },
          },
        });

        if (!account) {
          account = await prisma.account.create({
            data: { name: accountName, type: "CONTA", includeInTotal: true, userId },
          });
        }
      }

      // Busca mensagens no Gmail recebidas deste remetente
      const query = `from:${senderFilter}`;
      console.log(`[GoogleSync] Buscando mensagens no Gmail ("${query}") para a conta "${account.name}"...`);
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const listRawText = await listRes.text();
      let listData: any = {};
      try {
        listData = JSON.parse(listRawText);
      } catch {
        console.error("Resposta não-JSON da API do Gmail:", listRawText);
        if (listRawText.includes("has not been used") || listRawText.includes("is not enabled") || listRes.status === 403) {
          return {
            success: false,
            error: "A 'Gmail API' ainda não foi ativada no seu projeto do Google Cloud. Vá em 'APIs e Serviços' > 'Biblioteca' > pesquise 'Gmail API' e clique em 'Ativar'.",
          };
        }
        continue;
      }

      if (!listRes.ok) {
        console.error(`Erro na busca de mensagens do Gmail para ${senderFilter}:`, listData);
        continue;
      }

      const messages = listData.messages || [];
      totalMessagesFound += messages.length;
      console.log(`[GoogleSync] Mensagens encontradas para "${senderFilter}": ${messages.length}`);

      // Processa cada e-mail deste remetente
      for (const msg of messages) {
        if (processedMsgIds.has(msg.id)) continue;
        processedMsgIds.add(msg.id);

        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!msgRes.ok) continue;

          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          const subject = headers.find((h: any) => h.name?.toLowerCase() === "subject")?.value || "";
          const from = headers.find((h: any) => h.name?.toLowerCase() === "from")?.value || "";
          const rawBody = extractBody(msgData.payload);
          
          // Remove tags HTML, estilos, scripts e entidades
          const cleanBody = rawBody
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
            .replace(/<[^>]*>?/gm, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/\s+/g, " ");

          console.log(`[GoogleSync] Mensagem ID: ${msg.id} | Assunto: "${subject}" | De: "${from}"`);

          // Busca o valor
          let amount = 0;
          const amountMatch =
            cleanBody.match(/(?:Valor|Total|Valor da transação|Valor pago|Valor transferido|Valor recebido):\s*R\$?\s*([\d,.]+)/i) ||
            cleanBody.match(/(?:Corrida 99|Pagamento|Pix|Transferência) pag[oa] com sucesso.*?no total de R\$?\s*([\d,.]+)/i) ||
            cleanBody.match(/no total de R\$?\s*([\d,.]+)/i) ||
            cleanBody.match(/no valor de R\$?\s*([\d,.]+)/i) ||
            cleanBody.match(/R\$\s*([\d,.]+)/i);

          if (amountMatch && amountMatch[1]) {
            const rawAmount = String(amountMatch[1]).replace(/\./g, "").replace(",", ".");
            amount = parseFloat(rawAmount) || 0;
          }

          // Tipo: Despesa ou Receita
          let type: "EXPENSE" | "INCOME" = "EXPENSE";
          const isIncome =
            cleanBody.match(/(?:você recebeu|recebido|transferência recebida|pix recebido|crédito recebido)/i) ||
            subject.match(/(?:recebeu|recebido)/i);

          if (isIncome) {
            type = "INCOME";
          }

          // Descrição e Favorecido
          let description = "";
          const recipientMatch = cleanBody.match(/(?:Para|Destinatário|Favorecido|Beneficiário):\s*([\d.\s]*)([^,\n\r<]{2,100})/i);
          const senderMatch = cleanBody.match(/(?:De|Origem|Remetente|Pagador):\s*([\d.\s]*)([^,\n\r<]{2,100})/i);

          if (type === "INCOME") {
            let who = senderMatch?.[2]?.trim() || recipientMatch?.[2]?.trim() || account.name;
            who = who.split(/(?:Chave Pix|Chave|Data|Instituição|Banco|CPF|CNPJ|Valor|Horário)/i)[0].trim();
            description = `PIX de ${who}`.substring(0, 80);
          } else {
            if (cleanBody.includes("Corrida 99") || subject.includes("Corrida 99")) {
              description = "Corrida 99";
            } else {
              let who = recipientMatch?.[2]?.trim() || account.name;
              who = who.split(/(?:Chave Pix|Chave|Data|Instituição|Banco|CPF|CNPJ|Valor|Horário)/i)[0].trim();
              description = `PIX para ${who}`.substring(0, 80);
            }
          }

          // Código externo
          const externalIdMatch = cleanBody.match(/(?:Código da transação|ID do pedido|ID da transação|Autenticação|Protocolo):\s*([a-zA-Z0-9_-]+)/i);
          const externalId = externalIdMatch ? String(externalIdMatch[1]).trim() : `GMAIL_${msg.id}_${amount}`;

          // Data
          let date = msgData.internalDate ? new Date(parseInt(msgData.internalDate)) : new Date();
          const dateMatch = cleanBody.match(/(?:Data|Realizado em|Horário):\s*([\d/: ]+)/i);
          if (dateMatch) {
            const parsedD = parseDate(dateMatch[1]);
            if (!isNaN(parsedD.getTime())) date = parsedD;
          }

          const matched = amount > 0;
          console.log(`[GoogleSync] Match: ${matched} | Valor: ${amount} | Desc: "${description}" | Tipo: ${type} | Conta: "${account.name}"`);

          if (matched && amount > 0) {
            await prisma.transaction.upsert({
              where: { externalId },
              update: {
                userId,
                accountId: account.id,
                categoryId: category.id,
                amount,
                description,
                type,
                date,
                paid: true,
              },
              create: {
                description,
                amount,
                date,
                type,
                paid: true,
                externalId,
                categoryId: category.id,
                accountId: account.id,
                userId,
              },
            });
            totalSyncedCount++;
            detailsPerAccount[account.name] = (detailsPerAccount[account.name] || 0) + 1;

            // Tenta marcar o e-mail como lido no Gmail removendo o marcador UNREAD
            try {
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  removeLabelIds: ["UNREAD"],
                }),
              });
              console.log(`[GoogleSync] Mensagem ${msg.id} marcada como lida no Gmail.`);
            } catch (markErr) {
              console.log(`[GoogleSync] Não foi possível marcar mensagem ${msg.id} como lida no Gmail:`, markErr);
            }
          }
        } catch (itemErr) {
          console.error("Erro ao processar mensagem individual do Gmail:", itemErr);
        }
      }
    }

    revalidatePath("/");
    revalidatePath("/transactions");

    if (totalSyncedCount === 0) {
      return {
        success: true,
        count: 0,
        message: totalMessagesFound === 0
          ? `Nenhum e-mail recente encontrado para os remetentes configurados (${rules.map(r => r.email).join(", ")}).`
          : `Foram encontrados ${totalMessagesFound} e-mail(s), mas nenhum valor em R$ foi identificado no corpo dos comprovantes.`,
      };
    }

    const summaryParts = Object.entries(detailsPerAccount).map(([acc, count]) => `${count} em ${acc}`);
    const summaryText = summaryParts.length > 0 ? ` (${summaryParts.join(", ")})` : "";

    return {
      success: true,
      count: totalSyncedCount,
      message: `${totalSyncedCount} comprovante(s) sincronizado(s) com sucesso${summaryText}!`,
    };
  } catch (err: any) {
    console.error("Erro geral na sincronização com Gmail:", err);
    return { success: false, error: "Erro de comunicação com os servidores do Google." };
  }
}
