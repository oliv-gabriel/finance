"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("from") || "/";

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: username.trim(),
        password,
        callbackUrl,
      });

      if (result?.error) {
        setError("Usuário ou senha incorretos. Verifique suas credenciais.");
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError("Erro inesperado ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 sm:p-8 rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl backdrop-blur-sm">
      <h2 className="sr-only">Entrar na conta</h2>

      {/* Mensagem de Erro com acessibilidade aria-live */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm p-3 rounded-xl mb-5 text-center flex items-center justify-center gap-2"
        >
          <span>{error}</span>
        </div>
      )}

      {/* Formulário de Login */}
      <form onSubmit={handleUsernameLogin} className="space-y-4">
        {/* Campo Usuário */}
        <div>
          <label
            htmlFor="login-username"
            className="block text-xs font-semibold text-zinc-300 mb-1.5"
          >
            Nome de Usuário
          </label>
          <div className="relative">
            <User
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="login-username"
              name="username"
              type="text"
              placeholder="Digite seu usuário…"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              required
              className="w-full h-11 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-[#b300e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]/40 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Campo Senha */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-zinc-300 mb-1.5"
          >
            Senha
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full h-11 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-[#b300e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]/40 rounded-xl pl-10 pr-11 text-sm text-white placeholder-zinc-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4] transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Botão de Submissão no Padrão do Projeto */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl text-sm font-bold bg-[#b300e4] hover:bg-[#9a00c4] active:scale-[0.99] text-white shadow-md shadow-[#b300e4]/25 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181b]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Entrando…</span>
              </>
            ) : (
              <span>Acessar Conta</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
