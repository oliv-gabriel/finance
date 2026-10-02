"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  CheckCircle2,
  Grid3X3,
  Italic,
  List,
  ListOrdered,
  Palette,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";

const RICH_TEXT_STORAGE_KEY = "dashboard_notepad_html";
const PLAIN_TEXT_STORAGE_KEY = "dashboard_notepad";
const PAYMENT_TABLE_HTML = `
  <table>
    <thead>
      <tr>
        <th>Data do Recebimento</th>
        <th>Valor Recebido</th>
        <th>O que Pagar (Vencimento Original)</th>
        <th>Valor da Conta</th>
        <th>Guardar</th>
        <th>Saldo Livre Após Pagamentos</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="4">Dia 05</td>
        <td rowspan="4">R$ 1.915,00</td>
        <td>Direcional (Dia 15)</td>
        <td>R$ 231,00</td>
        <td rowspan="4">379,58</td>
        <td rowspan="4">R$ 460,62</td>
      </tr>
      <tr><td>Cartão BB (Dia 20)</td><td>R$ 100,29</td></tr>
      <tr><td>Despesa Avulsa (Dia 20)</td><td>R$ 72,82</td></tr>
      <tr><td>Caixa (Dia 22)</td><td>R$ 670,69</td></tr>
      <tr>
        <td>Dia 16</td>
        <td>R$ 1.000,00</td>
        <td>Cartório (Próximo Dia 05)</td>
        <td>R$ 271,00</td>
        <td>487,46</td>
        <td>R$ 241,54</td>
      </tr>
      <tr>
        <td>Dia 20</td>
        <td>R$ 828,00</td>
        <td>Faculdade (Próximo Dia 05)</td>
        <td>R$ 533,70</td>
        <td>132,96</td>
        <td>R$ 161,34</td>
      </tr>
      <tr>
        <td>TOTAIS</td>
        <td>R$ 3.743,00</td>
        <td><br></td>
        <td>R$ 1.879,50</td>
        <td>1000</td>
        <td>R$ 863,50</td>
      </tr>
    </tbody>
  </table>
  <p><br></p>
`;

export default function Notepad() {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectedTableRef = useRef<HTMLTableElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const richText = localStorage.getItem(RICH_TEXT_STORAGE_KEY);
    const plainText = localStorage.getItem(PLAIN_TEXT_STORAGE_KEY);

    if (richText) {
      editor.innerHTML = richText;
    } else if (plainText) {
      editor.textContent = plainText;
    }

    if (!editor.querySelector("table")) {
      if (editor.textContent?.trim()) editor.insertAdjacentHTML("beforeend", "<p><br></p>");
      editor.insertAdjacentHTML("beforeend", PAYMENT_TABLE_HTML);
    }

    localStorage.setItem(RICH_TEXT_STORAGE_KEY, editor.innerHTML);
    localStorage.removeItem(PLAIN_TEXT_STORAGE_KEY);
  }, []);

  const saveNote = () => {
    if (!editorRef.current) return;
    localStorage.setItem(RICH_TEXT_STORAGE_KEY, editorRef.current.innerHTML);
    localStorage.removeItem(PLAIN_TEXT_STORAGE_KEY);
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 1500);
  };

  const queueSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveNote, 600);
  };

  const runCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    queueSave();
  };

  const insertTable = () => {
    const rows = Math.min(12, Math.max(1, Number(prompt("Número de linhas", "4")) || 4));
    const columns = Math.min(12, Math.max(1, Number(prompt("Número de colunas", "4")) || 4));
    const cells = Array.from({ length: rows }, () =>
      `<tr>${"<td><br></td>".repeat(columns)}</tr>`
    ).join("");

    runCommand("insertHTML", `<table><tbody>${cells}</tbody></table><p><br></p>`);
  };

  const rememberSelectedTable = () => {
    const anchorNode = window.getSelection()?.anchorNode;
    const element = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
    const table = element?.closest("table");
    selectedTableRef.current = table && editorRef.current?.contains(table) ? table : null;
  };

  const setTableBorderColor = (color: string) => {
    const table = selectedTableRef.current;
    if (!table) {
      alert("Clique primeiro em uma célula da tabela que deseja alterar.");
      return;
    }

    table.style.borderColor = color;
    table.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
      cell.style.borderColor = color;
      cell.style.backgroundColor = "";
    });
    saveNote();
  };

  const clearNote = () => {
    if (!confirm("Deseja apagar toda a nota?")) return;
    if (editorRef.current) editorRef.current.innerHTML = "";
    saveNote();
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Bloco de notas</h2>
          {showSaved && (
            <span className="flex items-center rounded-full border border-emerald-800 bg-emerald-950/50 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="mr-1 size-3" /> Salvo
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={clearNote}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-950/30 hover:text-red-500"
          title="Limpar tudo"
        >
          <Trash2 size={15} />
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 bg-muted/20 px-6 py-1.5">
        <ToolbarButton onClick={() => runCommand("bold")} title="Negrito"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => runCommand("italic")} title="Itálico"><Italic size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onClick={() => runCommand("insertUnorderedList")} title="Lista"><List size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => runCommand("insertOrderedList")} title="Lista numerada"><ListOrdered size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onClick={insertTable} title="Inserir tabela"><Grid3X3 size={14} /></ToolbarButton>
        <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted" title="Cor das linhas da tabela selecionada">
          <Palette size={14} />
          <span>Cor das linhas</span>
          <input
            type="color"
            defaultValue="#3f3f46"
            onChange={(event) => setTableBorderColor(event.target.value)}
            className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>
        <ToolbarButton onClick={() => setTableBorderColor("")} title="Restaurar cor das linhas"><RotateCcw size={14} /></ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton onClick={() => runCommand("formatBlock", "h3")} title="Título">H</ToolbarButton>
        <ToolbarButton onClick={() => runCommand("removeFormat")} title="Limpar formatação"><Type size={14} /></ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={queueSave}
        onBlur={saveNote}
        onMouseUp={rememberSelectedTable}
        onKeyUp={rememberSelectedTable}
        className="min-h-40 flex-1 overflow-auto px-6 py-4 text-sm text-foreground outline-none [&_p]:mb-2 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:min-w-20 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-center [&_td]:align-middle [&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:p-2 [&_th]:text-center [&_th]:align-middle"
        aria-label="Bloco de notas"
      />
    </section>
  );
}

function ToolbarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="flex min-w-7 items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
      title={title}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px bg-border/60" />;
}
