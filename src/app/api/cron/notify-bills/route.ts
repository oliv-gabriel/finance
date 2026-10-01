import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // Verificação de segurança (Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers.get("authorization");
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers.get("x-cron-secret") !== process.env.CRON_SECRET // Suporte opcional pra header customizado
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Busca todas as despesas não pagas cujo vencimento é até o fim de hoje.
    // Ignoramos despesas de Cartão de Crédito, pois elas são pagas na Fatura, e não individualmente.
    const pendingBills = await prisma.transaction.findMany({
      where: {
        type: "EXPENSE",
        paid: false,
        date: {
          lte: endOfToday,
        },
        account: {
          type: "CONTA" // Apenas contas correntes/carteiras (ignora CARTAO)
        }
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    let message = ``;

    if (pendingBills.length === 0) {
      message = `🎉 *Lembrete Financeiro*\n\nNenhuma conta pendente ou atrasada para hoje! Pode relaxar. 😎`;
    } else {
      const todayBills = pendingBills.filter(t => t.date >= today);
      const overdueBills = pendingBills.filter(t => t.date < today);

      message = `🔔 *Lembrete Financeiro*\n\n`;

      if (todayBills.length > 0) {
        message += `📅 *Vencendo Hoje:*\n`;
        todayBills.forEach(bill => {
          const amount = Number(bill.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          message += `- ${bill.description}: ${amount} (${bill.account?.name || 'Sem conta'})\n`;
        });
        message += `\n`;
      }

      if (overdueBills.length > 0) {
        message += `⚠️ *Atrasadas:*\n`;
        overdueBills.forEach(bill => {
          const amount = Number(bill.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const dateStr = bill.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // UTC para evitar shift de timezone no DB
          message += `- ${bill.description}: ${amount} (Vencida dia ${dateStr})\n`;
        });
        message += `\n`;
      }

      message += `Acesse o painel para dar baixa! 🚀`;
    }

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      console.error("Credenciais do Telegram não configuradas no .env");
      return NextResponse.json({ error: "Telegram config missing" }, { status: 500 });
    }

    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Telegram API Error:", err);
      return NextResponse.json({ error: "Falha ao enviar mensagem no Telegram" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Notificação enviada!" });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
