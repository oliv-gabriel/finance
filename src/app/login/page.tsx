import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { Suspense } from "react";
import { CircleDollarSign } from "lucide-react";

export const metadata = {
  title: "Acesso - Sistema Financeiro",
  description: "Acesse suas finanças de forma simples e segura",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ register?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isRegister = searchParams.register === "true";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-8 select-none">
      {/* Botão de alternar tema no topo direito */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Efeitos de iluminação sutil no tema roxo da marca */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-[#b300e4]/10 blur-[130px] rounded-full pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#b300e4]/5 blur-[120px] rounded-full pointer-events-none" 
      />

      {/* Conteúdo Central */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Logo / Marca */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#b300e4]/15 border border-[#b300e4]/30 flex items-center justify-center shadow-lg shadow-[#b300e4]/20">
            <CircleDollarSign className="w-6 h-6 text-[#b300e4]" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Financeiro
          </h1>
        </div>

        {/* Formulário de Acesso */}
        <div className="w-full">
          <Suspense fallback={<div className="w-full h-[420px] animate-pulse bg-card border border-border rounded-2xl" />}>
            {isRegister ? <RegisterForm /> : <LoginForm />}
          </Suspense>
        </div>

        {/* Link para voltar ao Login caso esteja na tela de registro */}
        {isRegister && (
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b300e4] rounded-md px-2 py-1"
            >
              Já tem uma conta? <span className="text-[#b300e4] font-semibold hover:underline">Entrar</span>
            </Link>
          </div>
        )}

        {/* Rodapé discreto */}
        <p className="mt-8 text-[11px] text-muted-foreground tracking-wide text-center">
          Financeiro &bull; Gestão Pessoal Segura
        </p>
      </div>
    </div>
  );
}
