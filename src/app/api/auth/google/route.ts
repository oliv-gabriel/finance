import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/auth-utils";

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

  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

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
