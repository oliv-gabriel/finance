import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import ClientMainContent from "@/components/ClientMainContent";
import { isAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sistema de Gastos Pessoais",
  description: "Gerencie suas finanças de forma simples e eficiente",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let admin = false;
  try {
    admin = await isAdmin();
  } catch {
    // If not authenticated or error
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('finance-theme');var d=s==='dark'||((!s||s==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.classList.remove('light');r.style.colorScheme='dark';}else{r.classList.add('light');r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full min-w-0 overflow-x-clip bg-background text-foreground">
              <Sidebar isAdmin={admin} />
              <ClientMainContent>
                {children}
              </ClientMainContent>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
