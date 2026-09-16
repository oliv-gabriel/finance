"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { User, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/authActions";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

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
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[#1a1a1a] border border-white/5 shadow-2xl text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Conta Criada!</h2>
        <p className="text-sm text-gray-400 mb-6">Sua conta foi criada e você já está logado.</p>
        <Button 
          onClick={() => router.push("/")}
          className="w-full bg-[#b300e4] hover:bg-[#b300e4]/90 text-white"
        >
          Ir para o Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[#1a1a1a] border border-white/5 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Criar Conta</h2>
        <p className="text-sm text-gray-400">Configure seu acesso restrito</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            <input
              type="text"
              name="username"
              placeholder="Nome de Usuário"
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
              name="password"
              placeholder="Senha"
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#b300e4]/50 focus:ring-1 focus:ring-[#b300e4]/50 transition-all"
              required
              minLength={6}
            />
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-12 text-base font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 text-white mt-4 transition-all"
        >
          {loading ? "Criando..." : "Criar Conta"}
        </Button>
      </form>
    </div>
  );
}
