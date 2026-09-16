import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export const metadata = {
  title: "Acesso - FinanceApp",
  description: "Acesse suas finanças",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ register?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isRegister = searchParams.register === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Elementos de background para dar um efeito premium */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#b300e4] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500 opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full px-4">
        <Suspense fallback={<div className="w-full max-w-md mx-auto h-[400px] animate-pulse bg-[#1a1a1a] rounded-2xl"></div>}>
          {isRegister ? <RegisterForm /> : <LoginForm />}
        </Suspense>

        <div className="text-center mt-6">
          {isRegister ? (
            <a href="/login" className="text-gray-500 hover:text-white text-sm transition-colors">
              Já tem uma conta? Entrar
            </a>
          ) : (
            <a href="/login?register=true" className="text-gray-500 hover:text-white text-sm transition-colors">
              Primeiro acesso? Criar conta
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
