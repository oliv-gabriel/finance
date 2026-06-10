"use client";

import { useState } from "react";
import { syncEmails } from "@/app/actions/emailSync";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, Check } from "lucide-react";

export default function SyncEmailsButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [count, setCount] = useState(0);

    const handleSync = async () => {
        setStatus("loading");
        const result = await syncEmails();

        if (result.success) {
            setCount(result.count || 0);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 5000);
        } else {
            setStatus("error");
            alert(result.error || "Erro ao sincronizar e-mails.");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={status === "loading"}
            variant="outline"
            className="h-9 px-3 gap-2"
        >
            {status === "loading" ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sincronizando...</span>
                </>
            ) : status === "success" ? (
                <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{count} novos PIXs!</span>
                </>
            ) : (
                <>
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Sincronizar 99Pay</span>
                </>
            )}
        </Button>
    );
}
