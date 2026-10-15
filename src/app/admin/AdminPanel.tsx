"use client";

import { useState } from "react";
import { registerUser } from "../actions/authActions";
import { Button } from "@/components/ui/Button";
import { UserPlus, ShieldAlert } from "lucide-react";

export function AdminPanel() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const formData = new FormData();
      formData.append("username", name);
      formData.append("password", password);
      const result = await registerUser(formData);
      if (result.success) {
        setMessage("✅ Usuário criado com sucesso!");
        setName("");
        setPassword("");
      } else {
        setMessage(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setMessage("❌ Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-xs w-full max-w-md mx-auto mt-10">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Painel de Administração</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Crie novos acessos isolados para o sistema. Cada usuário verá apenas suas próprias finanças.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nome do Usuário de Acesso</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 bg-background border border-input rounded-xl px-4 text-foreground focus:ring-2 focus:ring-[#b300e4] outline-none"
            placeholder="Ex: maria_financas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Senha Provisória</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 bg-background border border-input rounded-xl px-4 text-foreground focus:ring-2 focus:ring-[#b300e4] outline-none"
            placeholder="Mínimo 6 caracteres"
            minLength={6}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm font-medium ${message.includes("✅") ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
            {message}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-[#b300e4] hover:bg-[#b300e4]/90 text-white font-bold rounded-xl mt-4"
        >
          {isLoading ? "Criando..." : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Criar Novo Usuário
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
