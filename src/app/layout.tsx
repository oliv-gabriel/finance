import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarProvider";
import ClientMainContent from "@/components/ClientMainContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#121212] text-foreground`} style={{ backgroundColor: "#121212" }}>
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
