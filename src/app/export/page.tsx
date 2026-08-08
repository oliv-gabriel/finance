"use client";

import { useState } from "react";
import { getTransactions } from "@/app/actions/transactions";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { stringify } from "csv-stringify/sync";

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const transactions = await getTransactions();
      
      const data = transactions.map((t) => ({
        ID: t.id,
        Data: new Date(t.date).toLocaleDateString("pt-BR"),
        Descricao: t.description,
        Tipo: t.type === "INCOME" ? "Receita" : "Despesa",
        Categoria: t.category?.name || "Sem categoria",
        Valor: t.amount,
      }));

      const csvContent = stringify(data, {
        header: true,
        delimiter: ";",
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `financeiro-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Falha ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full space-y-8 flex-1 overflow-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Exportar Dados</h1>
        <p className="text-muted-foreground mt-1">
          Baixe todas as suas transações em formato CSV para usar no Excel ou Google Sheets.
        </p>
      </div>

      <div className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-border/50 pb-4 mb-6">
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Exportar para CSV</h2>
          </div>
          <p className="text-xs text-muted-foreground ml-10">
            Todas as transações cadastradas até o momento serão incluídas no arquivo.
          </p>
        </div>
        <div className="mb-8">
          <div className="bg-muted/30 border border-border/40 p-5 rounded-xl">
            <h4 className="text-sm font-semibold text-foreground mb-2.5">Campos incluídos:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1.5 font-medium">
              <li>Data da transação</li>
              <li>Descrição</li>
              <li>Tipo (Receita/Despesa)</li>
              <li>Categoria</li>
              <li>Valor (R$)</li>
            </ul>
          </div>
        </div>
        <div className="pt-2">
          <Button 
            className="w-full h-11 rounded-xl text-sm font-semibold shadow-2xs" 
            size="lg" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
