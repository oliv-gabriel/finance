"use client";

import { signIn } from "next-auth/react";
import { signIn as signInWebAuthn } from "next-auth/webauthn";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Fingerprint, User, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("from") || "/";

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWebAuthn("passkey", {
        redirect: false,
        action: "authenticate",
        callbackUrl
      });
      if (result?.error) {
        setError("Erro ao autenticar com Passkey. Tente novamente ou use usuário/senha.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError("Erro inesperado com Passkey.");
    }
    setLoading(false);
  };

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        username, // Passamos o username no lugar do email para o authorize
        password,
        callbackUrl
      });
      if (result?.error) {
        setError("Credenciais inválidas.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError("Erro inesperado no login.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[#1a1a1a] border border-white/5 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#b300e4]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#b300e4]/30 shadow-[0_0_15px_rgba(179,0,228,0.3)]">
          <Lock className="w-8 h-8 text-[#b300e4]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
        <p className="text-sm text-gray-400">Desbloqueie para visualizar as finanças</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}

      <Button 
        type="button" 
        disabled={loading} 
        onClick={handlePasskeyLogin}
        className="w-full bg-[#b300e4] hover:bg-[#b300e4]/90 text-white font-bold h-12 text-base shadow-[0_4px_15px_rgba(179,0,228,0.3)] hover:shadow-[0_6px_20px_rgba(179,0,228,0.4)] transition-all flex items-center justify-center gap-2 mb-8"
      >
        <Fingerprint className="w-5 h-5" />
        {loading ? "Aguardando..." : "Entrar com Digital ou Face ID"}
      </Button>

      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#1a1a1a] px-3 text-gray-500 font-medium uppercase tracking-wider">ou use sua senha</span>
        </div>
      </div>

      <form onSubmit={handleUsernameLogin} className="space-y-4">
        <div>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Nome de Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#b300e4]/50 focus:ring-1 focus:ring-[#b300e4]/50 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#b300e4]/50 focus:ring-1 focus:ring-[#b300e4]/50 transition-all"
              required
            />
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          variant="outline"
          className="w-full h-12 text-base font-medium border-white/10 hover:bg-white/5 text-white mt-2"
        >
          Acessar com Usuário
        </Button>
      </form>
    </div>
  );
}
