"use client";

import { useState } from "react";
import { User, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/authActions";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string)?.trim();
    const password = formData.get("password") as string;

    if (!username || !password) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result?.success) {
      setSuccess(true);
      // Auto login após o registro
      await signIn("credentials", {
        redirect: false,
        username,
        password,
      });
      router.push("/");
    }
  };

  if (success) {
    return (
      <div className="w-full p-6 sm:p-8 rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl text-center">
        <div className="w-14 h-14 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <CheckCircle2 className="w-7 h-7 text-green-500" aria-hidden="true" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5 tracking-tight">
          Conta Criada!
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mb-6">
          Sua conta foi criada com sucesso e você já está conectado.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full h-11 rounded-xl text-sm font-bold bg-[#b300e4] hover:bg-[#9a00c4] active:scale-[0.99] text-white shadow-md shadow-[#b300e4]/25 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]"
        >
          <span>Ir para o Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-6 sm:p-8 rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl backdrop-blur-sm">
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Criar Nova Conta
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Configure seu acesso restrito para iniciar
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm p-3 rounded-xl mb-5 text-center flex items-center justify-center gap-2"
        >
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Usuário */}
        <div>
          <label
            htmlFor="register-username"
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
              id="register-username"
              type="text"
              name="username"
              placeholder="Escolha um nome de usuário…"
              autoComplete="username"
              spellCheck={false}
              required
              className="w-full h-11 bg-[#121212] border border-white/10 hover:border-white/20 focus:border-[#b300e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4]/40 rounded-xl pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-zinc-300 mb-1.5"
          >
            Senha (mínimo 6 caracteres)
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Crie uma senha segura…"
              autoComplete="new-password"
              required
              minLength={6}
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

        {/* Botão de Criação */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl text-sm font-bold bg-[#b300e4] hover:bg-[#9a00c4] active:scale-[0.99] text-white shadow-md shadow-[#b300e4]/25 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181b]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Criando…</span>
              </>
            ) : (
              <span>Criar Conta</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
