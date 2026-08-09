import { NextResponse } from "next/server";

export async function GET() {
  console.log("=========================================");
  console.log("🟢 TESTE DE LOG NA VERCEL INICIADO 🟢");
  console.log("=========================================");
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const dbUrl = process.env.DATABASE_URL;

  // Esconde parte da senha e email por segurança
  const maskedEmail = emailUser ? `${emailUser.substring(0, 3)}***@***` : "NÃO CONFIGURADO";
  const hasPass = emailPass ? "SIM (Configurada)" : "NÃO CONFIGURADA";
  const hasDb = dbUrl ? "SIM" : "NÃO CONFIGURADO";

  console.log(`- EMAIL_USER: ${maskedEmail}`);
  console.log(`- EMAIL_PASS: ${hasPass}`);
  console.log(`- DATABASE_URL: ${hasDb}`);
  console.log("=========================================");

  return NextResponse.json({
    status: "Log disparado com sucesso!",
    ambienteVercel: {
      EMAIL_USER: maskedEmail,
      EMAIL_PASS: hasPass,
      DATABASE_URL_PRESENTE: hasDb,
    },
    dica: "Abra a aba Logs na Vercel para ver a mensagem verde que acabou de ser impressa."
  });
}
