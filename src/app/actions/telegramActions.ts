"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function getTelegramSettings() {
  try {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        telegramChatId: true,
        telegramNotifyBills: true,
      },
    });

    if (!user) {
      return { error: "Usuário não encontrado." };
    }

    const botConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);

    return {
      success: true,
      telegramChatId: user.telegramChatId || "",
      telegramNotifyBills: user.telegramNotifyBills ?? true,
      botConfigured,
    };
  } catch (error: any) {
    console.error("Erro ao carregar configurações do Telegram:", error);
    return { error: "Não foi possível carregar as configurações do Telegram." };
  }
}

export async function saveTelegramSettings(data: {
  telegramChatId: string;
  telegramNotifyBills: boolean;
}) {
  try {
    const userId = await getCurrentUserId();
    const cleanChatId = data.telegramChatId.trim();

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: cleanChatId.length > 0 ? cleanChatId : null,
        telegramNotifyBills: data.telegramNotifyBills,
      },
    });

    revalidatePath("/profile");
    return { success: true, message: "Configurações do Telegram salvas com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao salvar configurações do Telegram:", error);
    return { error: "Falha ao salvar configurações do Telegram." };
  }
}

export async function sendTestTelegramMessage() {
  try {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        telegramChatId: true,
      },
    });

    if (!user?.telegramChatId) {
      return { error: "Nenhum Chat ID do Telegram configurado. Salve seu ID antes de testar." };
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return {
        error: "O TELEGRAM_BOT_TOKEN não está configurado nas variáveis de ambiente (.env do servidor).",
      };
    }

    const userName = user.name || "Usuário";
    const text = `🔔 *Teste de Notificação - Sistema Financeiro*\n\n` +
      `Olá, *${userName}*! 👋\n` +
      `Seu Telegram foi conectado com sucesso ao Sistema Financeiro.\n\n` +
      `A partir de agora você receberá seus lembretes diários de contas por aqui! 🚀`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: user.telegramChatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      const description = result?.description || "Falha desconhecida";
      console.error("Erro Telegram API:", result);

      if (description.includes("chat not found")) {
        return {
          error: "Chat ID não encontrado. Certifique-se de ter aberto o bot no Telegram e clicado em 'Começar' (/start) antes de testar.",
        };
      }
      if (description.includes("bot was blocked")) {
        return {
          error: "O bot está bloqueado no seu Telegram. Desbloqueie o bot e tente novamente.",
        };
      }

      return { error: `Erro do Telegram: ${description}` };
    }

    return {
      success: true,
      message: "Mensagem de teste enviada com sucesso! Verifique seu Telegram.",
    };
  } catch (error: any) {
    console.error("Erro ao enviar mensagem de teste do Telegram:", error);
    return { error: "Ocorreu um erro ao enviar a mensagem de teste." };
  }
}

