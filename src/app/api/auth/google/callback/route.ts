import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserSession } from "@/lib/auth-utils";

function getRedirectUri(req: Request): string {
  const envUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, "")}/api/auth/google/callback`;
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  if (host) {
    return `${proto}://${host}/api/auth/google/callback`;
  }
  const url = new URL(req.url);
  return `${url.origin}/api/auth/google/callback`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const session = await getCurrentUserSession();
  if (!session?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (error || !code) {
    console.error("Google OAuth error:", error || "Código de autorização ausente");
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(error || "Falha na autorização do Google")}`, req.url)
    );
  }

  // Valida que o state corresponde ao usuário logado
  if (state && state !== session.id) {
    return NextResponse.redirect(
      new URL("/profile?error=Incompatibilidade de sessão na autorização", req.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri(req);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/profile?error=Chaves do Google Cloud não configuradas no servidor", req.url)
    );
  }

  try {
    // 1. Troca o código pelos tokens de acesso e refresh
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Erro ao obter tokens do Google:", tokenData);
      return NextResponse.redirect(
        new URL(`/profile?error=${encodeURIComponent(tokenData.error_description || "Falha ao obter token do Google")}`, req.url)
      );
    }

    // 2. Obtém o e-mail da conta Google conectada
    let googleEmail = "";
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        googleEmail = userInfo.email || "";
      }
    } catch (e) {
      console.error("Erro ao obter informações do usuário Google:", e);
    }

    // 3. Calcula o prazo de expiração
    const expiresInSeconds = tokenData.expires_in || 3600;
    const tokenExpiry = new Date(Date.now() + expiresInSeconds * 1000);

    // 4. Salva no banco de dados para o usuário logado
    await prisma.user.update({
      where: { id: session.id },
      data: {
        googleEmail: googleEmail || undefined,
        googleAccessToken: tokenData.access_token,
        // Salva o refresh_token se retornado (Google só envia no primeiro consentimento ou com prompt=consent)
        ...(tokenData.refresh_token ? { googleRefreshToken: tokenData.refresh_token } : {}),
        googleTokenExpiry: tokenExpiry,
      },
    });

    return NextResponse.redirect(new URL("/profile?google=connected", req.url));
  } catch (err: any) {
    console.error("Exceção no callback do Google OAuth:", err);
    return NextResponse.redirect(
      new URL("/profile?error=Erro ao processar conexão com o Google", req.url)
    );
  }
}
