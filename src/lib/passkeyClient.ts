export function assertPasskeySupport() {
  if (!window.isSecureContext) {
    throw new Error("Passkeys exigem HTTPS (ou localhost durante o desenvolvimento).")
  }

  if (!("PublicKeyCredential" in window)) {
    throw new Error("Este navegador ou aparelho não oferece suporte a passkeys.")
  }
}

export function passkeyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "A verificação foi cancelada ou demorou demais. Tente novamente."
  }

  if (error instanceof Error && error.message) return error.message

  return fallback
}
