import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // Verificação de segurança (Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers.get("authorization");
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers.get("x-cron-secret") !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramBotToken) {
    console.error("TELEGRAM_BOT_TOKEN não configurado no .env");
    return NextResponse.json({ error: "Telegram bot token missing" }, { status: 500 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Busca todos os usuários com Telegram configurado e notificações ativas
    const usersWithTelegram = await prisma.user.findMany({
      where: {
        telegramChatId: { not: null },
        telegramNotifyBills: true,
      },
      select: {
        id: true,
        name: true,
        telegramChatId: true,
      },
    });

    const sendTelegramMessage = async (chatId: string, text: string) => {
      const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      const res = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      });
      return res.ok;
    };

    const buildBillsMessage = (userName: string | null, bills: any[]) => {
      const userGreeting = userName ? ` - ${userName}` : "";

      if (bills.length === 0) {
        return `🎉 *Lembrete Financeiro${userGreeting}*\n\nNenhuma conta pendente ou atrasada para hoje! Pode relaxar. 😎`;
      }

      const todayBills = bills.filter((t) => new Date(t.date) >= today);
      const overdueBills = bills.filter((t) => new Date(t.date) < today);

      let message = `🔔 *Lembrete Financeiro${userGreeting}*\n\n`;

      if (todayBills.length > 0) {
        message += `📅 *Vencendo Hoje:*\n`;
        todayBills.forEach((bill) => {
          const amount = Number(bill.amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          const accountLabel = bill.account
            ? bill.account.type === "CARTAO"
              ? `${bill.account.name} (Cartão)`
              : bill.account.name
            : "Sem conta";
          message += `• ${bill.description}: ${amount} (${accountLabel})\n`;
        });
        message += `\n`;
      }

      if (overdueBills.length > 0) {
        message += `⚠️ *Atrasadas:*\n`;
        overdueBills.forEach((bill) => {
          const amount = Number(bill.amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          const dateStr = new Date(bill.date).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          });
          const accountLabel = bill.account
            ? bill.account.type === "CARTAO"
              ? `${bill.account.name} (Cartão)`
              : bill.account.name
            : "Sem conta";
          message += `• ${bill.description}: ${amount} (Vencida em ${dateStr} - ${accountLabel})\n`;
        });
        message += `\n`;
      }

      message += `Acesse o painel para dar baixa! 🚀`;
      return message;
    };

    let sentCount = 0;

    // 2. Se há usuários com Telegram, envia as contas personalizadas de cada um
    if (usersWithTelegram.length > 0) {
      for (const user of usersWithTelegram) {
        if (!user.telegramChatId) continue;

        // Busca todas as despesas não pagas até o fim do dia de hoje (contas correntes, cartões ou sem conta)
        const userPendingBills = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            type: "EXPENSE",
            paid: false,
            date: { lte: endOfToday },
          },
          include: { account: true },
          orderBy: { date: "asc" },
        });

        const msg = buildBillsMessage(user.name, userPendingBills);
        if (msg) {
          const success = await sendTelegramMessage(user.telegramChatId, msg);
          if (success) sentCount++;
        }
      }
    } else if (process.env.TELEGRAM_CHAT_ID) {
      // 3. Fallback legado global
      const pendingBills = await prisma.transaction.findMany({
        where: {
          type: "EXPENSE",
          paid: false,
          date: { lte: endOfToday },
        },
        include: { account: true },
        orderBy: { date: "asc" },
      });

      const msg = buildBillsMessage("Geral", pendingBills);
      if (msg) {
        const success = await sendTelegramMessage(process.env.TELEGRAM_CHAT_ID, msg);
        if (success) sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notificações processadas. Enviadas: ${sentCount}.`,
      usersChecked: usersWithTelegram.length,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
