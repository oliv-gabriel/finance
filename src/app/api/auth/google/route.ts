import { NextResponse } from "next/server";
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
  const session = await getCurrentUserSession();
  if (!session?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/profile?error=As credenciais GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET ainda não foram configuradas no arquivo .env.", req.url)
    );
  }

  const redirectUri = getRedirectUri(req);

  const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.modify",
  ].join(" ");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", scopes);
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", session.id);

  return NextResponse.redirect(googleAuthUrl.toString());
}
