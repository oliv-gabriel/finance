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
    <div className="h-full flex flex-col shadow-xs bg-card border border-border/70 rounded-2xl overflow-hidden">
      <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold tracking-tight">Bloco de Notas</h2>
          {showStatus && (
            <span className="flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-300">
              <CheckCircle2 size={12} className="mr-1" />
              Salvo
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={handleClear}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Limpar tudo"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      
      {/* Barra de Ferramentas de Formatação */}
      <div className="flex items-center gap-0.5 px-6 py-1.5 bg-muted/20 border-b border-border/50 flex-wrap">
        <ToolbarButton onClick={() => execCommand("bold")} title="Negrito"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand("italic")} title="Itálico"><Italic size={14} /></ToolbarButton>
        <div className="w-px h-4 bg-border/60 mx-1" />
        <ToolbarButton onClick={() => execCommand("insertUnorderedList")} title="Lista"><List size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand("insertOrderedList")} title="Lista Numerada"><ListOrdered size={14} /></ToolbarButton>
        <div className="w-px h-4 bg-border/60 mx-1" />
        <ToolbarButton onClick={insertTable} title="Inserir Tabela"><Grid3X3 size={14} /></ToolbarButton>
        <div className="w-px h-4 bg-border/60 mx-1" />
        <ToolbarButton onClick={() => execCommand("formatBlock", "h3")} title="Título">H</ToolbarButton>
        <ToolbarButton onClick={() => execCommand("removeFormat")} title="Limpar Formatação"><Type size={14} /></ToolbarButton>
      </div>

      <div className="flex-1 p-0 overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          .notepad-editor table { width: 100%; border-collapse: collapse; }
          .notepad-editor td { border: 1px solid #e2e8f0; padding: 8px; min-width: 80px; }
          .notepad-editor p { margin-bottom: 0.5rem; }
        `}} />
        <div
          ref={editorRef}
          contentEditable
          className="notepad-editor w-full h-full px-6 py-4 overflow-auto focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
          style={{ minHeight: "120px" }}
        />
      </div>
    </div>
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
