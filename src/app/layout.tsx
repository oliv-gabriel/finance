import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarProvider";
import ClientMainContent from "@/components/ClientMainContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sistema de Gastos Pessoais",
  description: "Gerencie suas finanças de forma simples e eficiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" style={{ backgroundColor: "#121212" }}>
      <body className="antialiased bg-[#121212] text-foreground" style={{ backgroundColor: "#121212" }}>
        <SidebarProvider>
          <div className="flex min-h-screen bg-[#121212] text-foreground">
            <Sidebar />
            <ClientMainContent>
              {children}
            </ClientMainContent>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
