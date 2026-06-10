"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Save, Trash2, CheckCircle2, Bold, Italic, List, ListOrdered, Type, Grid3X3 } from "lucide-react";

export default function Notepad() {
  const [isSaved, setIsSaved] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Carregar conteúdo inicial
  useEffect(() => {
    const savedContent = localStorage.getItem("dashboard_notepad_html");
    if (savedContent && editorRef.current) {
      editorRef.current.innerHTML = savedContent;
    }
  }, []);

  // Função para salvar
  const saveNote = useCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    localStorage.setItem("dashboard_notepad_html", content);
    setIsSaved(true);
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 2000);
  }, []);

  // Auto-save com debounce
  useEffect(() => {
    const handleInput = () => {
      setIsSaved(false);
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener("input", handleInput);
    }

    const timeoutId = setTimeout(() => {
      if (!isSaved) saveNote();
    }, 2000);

    return () => {
      if (editor) editor.removeEventListener("input", handleInput);
      clearTimeout(timeoutId);
    };
  }, [isSaved, saveNote]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    setIsSaved(false);
  };

  const insertTable = () => {
    const rows = 3;
    const cols = 3;
    let tableHTML = `<table style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #e2e8f0;">`;
    for (let i = 0; i < rows; i++) {
      tableHTML += `<tr>`;
      for (let j = 0; j < cols; j++) {
        tableHTML += `<td style="border:1px solid #e2e8f0; padding:8px; min-width:80px;">&nbsp;</td>`;
      }
      tableHTML += `</tr>`;
    }
    tableHTML += `</table><p>&nbsp;</p>`;
    execCommand("insertHTML", tableHTML);
  };

  const handleClear = () => {
    if (confirm("Deseja apagar toda a nota?")) {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
        saveNote();
      }
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between py-2 border-b drag-handle cursor-move bg-transparent rounded-t-lg">
        <div className="flex items-center gap-2">
          <CardTitle className="text-md">Bloco de Notas</CardTitle>
          {showStatus && (
            <span className="flex items-center text-[10px] text-green-600 animate-in fade-in duration-300">
              <CheckCircle2 size={12} className="mr-1" />
              Salvo
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={handleClear}
            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
            title="Limpar tudo"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </CardHeader>
      
      {/* Barra de Ferramentas de Formatação */}
      <div className="flex items-center gap-0.5 p-1 bg-muted/30 border-b flex-wrap">
        <ToolbarButton onClick={() => execCommand("bold")} title="Negrito"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand("italic")} title="Itálico"><Italic size={14} /></ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={() => execCommand("insertUnorderedList")} title="Lista"><List size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand("insertOrderedList")} title="Lista Numerada"><ListOrdered size={14} /></ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={insertTable} title="Inserir Tabela"><Grid3X3 size={14} /></ToolbarButton>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={() => execCommand("formatBlock", "h3")} title="Título">H</ToolbarButton>
        <ToolbarButton onClick={() => execCommand("removeFormat")} title="Limpar Formatação"><Type size={14} /></ToolbarButton>
      </div>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          .notepad-editor table { width: 100%; border-collapse: collapse; }
          .notepad-editor td { border: 1px solid #e2e8f0; padding: 8px; min-width: 80px; }
          .notepad-editor p { margin-bottom: 0.5rem; }
        `}} />
        <div
          ref={editorRef}
          contentEditable
          className="notepad-editor w-full h-full p-4 overflow-auto focus:outline-none prose prose-sm max-w-none dark:prose-invert"
          style={{ minHeight: "100px" }}
        />
      </CardContent>
    </Card>
  );
}

function ToolbarButton({ children, onClick, title }: { children: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Impede que o foco saia do editor
        onClick();
      }}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors flex items-center justify-center min-w-[28px]"
      title={title}
    >
      {children}
    </button>
  );
}
