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
        Categoria: t.category.name,
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exportar Dados</h1>
        <p className="text-muted-foreground">
          Baixe todas as suas transações em formato CSV para usar no Excel ou Google Sheets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <CardTitle>Exportar para CSV</CardTitle>
          </div>
          <CardDescription>
            Todas as transações cadastradas até o momento serão incluídas no arquivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Campos incluídos:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Data da transação</li>
              <li>Descrição</li>
              <li>Tipo (Receita/Despesa)</li>
              <li>Categoria</li>
              <li>Valor (R$)</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t p-6">
          <Button 
            className="w-full" 
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
        </CardFooter>
      </Card>
    </div>
  );
}
