"use client";

import { useState } from "react";
import { syncEmails } from "@/app/actions/emailSync";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, Check } from "lucide-react";

export default function SyncEmailsButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [count, setCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSync = async () => {
        setStatus("loading");
        setErrorMessage(null);
        
        try {
            const result = await syncEmails();

            if (result.success) {
                setCount(result.count || 0);
                setStatus("success");
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
                setErrorMessage(result.error || "Falha de autenticação IMAP");
                setTimeout(() => {
                    setStatus("idle");
                    setErrorMessage(null);
                }, 5000);
            }
        } catch (err) {
            setStatus("error");
            setErrorMessage("Serviço indisponível no momento");
            setTimeout(() => {
                setStatus("idle");
                setErrorMessage(null);
            }, 5000);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={status === "loading"}
            title={errorMessage ? `Detalhes do erro: ${errorMessage}` : "Clique para buscar comprovantes de PIX no e-mail"}
            className={`inline-flex items-center gap-2.5 h-9 px-4 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer disabled:cursor-wait ${
                status === "loading"
                    ? "bg-[#b300e4]/15 text-[#b300e4] border-[#b300e4]/40 animate-pulse shadow-sm shadow-[#b300e4]/20"
                    : status === "success"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-2xs"
                    : status === "error"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-card/80 hover:bg-card text-foreground border-border/80 hover:border-[#b300e4]/50 hover:shadow-xs"
            }`}
        >
            {status === "loading" ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#b300e4]" />
                    <span>Sincronizando 99Pay...</span>
                </>
            ) : status === "success" ? (
                <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>{count === 0 ? "Tudo atualizado!" : `${count} novo(s) PIX gravados!`}</span>
                </>
            ) : status === "error" ? (
                <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-0.5" />
                    <span className="truncate max-w-[180px]">{errorMessage || "Erro no IMAP"}</span>
                </>
            ) : (
                <>
                    <div className="p-1 rounded-md bg-[#b300e4]/15 text-[#b300e4] flex items-center justify-center">
                        <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span>Sincronizar 99Pay</span>
                </>
            )}
        </button>
    );
}
