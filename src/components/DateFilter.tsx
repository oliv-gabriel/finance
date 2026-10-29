"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const defaultStartDate = `${currentYear}-${pad(currentMonth)}-01`;
  const lastDayOfCurrent = new Date(currentYear, currentMonth, 0).getDate();
  const defaultEndDate = `${currentYear}-${pad(currentMonth)}-${pad(lastDayOfCurrent)}`;

  const startDate = searchParams.get("startDate") || defaultStartDate;
  const endDate = searchParams.get("endDate") || defaultEndDate;

  // Local draft states inside the popover
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);

  useEffect(() => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
  }, [startDate, endDate]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Check if current selection is an entire month
  const parts = startDate.split("-");
  const activeY = parts.length === 3 ? parseInt(parts[0]) : currentYear;
  const activeM = parts.length === 3 ? parseInt(parts[1]) : currentMonth;

  const isFullMonth = (() => {
    const partsS = startDate.split("-");
    const partsE = endDate.split("-");
    if (partsS.length !== 3 || partsE.length !== 3) return false;
    if (partsS[0] !== partsE[0] || partsS[1] !== partsE[1]) return false;
    if (partsS[2] !== "01") return false;
    const lastDay = new Date(parseInt(partsS[0]), parseInt(partsS[1]), 0).getDate();
    return partsE[2] === pad(lastDay);
  })();

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return "";
    const p = dStr.split("-");
    if (p.length === 3) {
      return `${p[2]}/${p[1]}/${p[0]}`;
    }
    return dStr;
  };

  const periodTitle = isFullMonth
    ? `${MONTH_NAMES[activeM - 1]} de ${activeY}`
    : `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;

  const isCurrentMonthActive = startDate === defaultStartDate && endDate === defaultEndDate;

  const applyParams = (s: string, e: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    params.delete("year");
    params.set("startDate", s);
    params.set("endDate", e);
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyMonth = (year: number, month: number) => {
    const lastDay = new Date(year, month, 0).getDate();
    const newStart = `${year}-${pad(month)}-01`;
    const newEnd = `${year}-${pad(month)}-${pad(lastDay)}`;
    setDraftStart(newStart);
    setDraftEnd(newEnd);
    applyParams(newStart, newEnd);
  };

  // Mês Anterior
  const handlePrevMonth = () => {
    let m = activeM - 1;
    let y = activeY;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    applyMonth(y, m);
  };

  // Próximo Mês
  const handleNextMonth = () => {
    let m = activeM + 1;
    let y = activeY;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    applyMonth(y, m);
  };

  // Mês Atual
  const handleCurrentMonth = () => {
    applyMonth(currentYear, currentMonth);
  };

  // Aplicar Intervalo Manual
  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftStart || !draftEnd) return;
    if (draftStart > draftEnd) {
      alert("A data inicial não pode ser posterior à data final.");
      return;
    }
    applyParams(draftStart, draftEnd);
    setIsOpen(false);
  };

  // Atalhos rápidos
  const applyShortcut = (type: "today" | "7days" | "15days" | "thisMonth" | "lastMonth") => {
    const today = new Date();
    const toYMD = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let s = "";
    let e = "";

    if (type === "today") {
      s = toYMD(today);
      e = toYMD(today);
    } else if (type === "7days") {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      s = toYMD(past);
      e = toYMD(today);
    } else if (type === "15days") {
      const past = new Date(today);
      past.setDate(today.getDate() - 14);
      s = toYMD(past);
      e = toYMD(today);
    } else if (type === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      s = toYMD(start);
      e = toYMD(end);
    } else if (type === "lastMonth") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      s = toYMD(start);
      e = toYMD(end);
    }

    setDraftStart(s);
    setDraftEnd(e);
    applyParams(s, e);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Botão Cápsula Limpo no Navbar (sem ícone, apenas as datas centralizadas, sem azul ao clicar) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 px-4 sm:px-5 rounded-full bg-[#18181b] border border-white/10 hover:border-white/20 hover:bg-white/5 focus:border-[#b300e4] focus:ring-2 focus:ring-[#b300e4]/30 shadow-xs transition-all duration-200 cursor-pointer select-none"
        title="Clique para navegar pelos meses ou escolher um período"
      >
        <span className="text-white text-xs sm:text-sm font-semibold tracking-tight">
          {formatDisplayDate(startDate)}
        </span>
        <span className="text-zinc-500 text-xs mx-2.5 sm:mx-3 select-none font-medium">
          –
        </span>
        <span className="text-white text-xs sm:text-sm font-semibold tracking-tight">
          {formatDisplayDate(endDate)}
        </span>
      </button>

      {/* Popover com os botões que abre ao clicar nas datas */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-76 sm:w-80 rounded-2xl bg-[#18181b] border border-white/10 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Título do período ativo */}
          <div className="text-center pb-2.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Período Selecionado
            </span>
            <p className="text-sm font-bold text-white capitalize mt-0.5">
              {periodTitle}
            </p>
          </div>

          {/* Os 3 botões solicitados: Mês Anterior, Mês Atual, Próximo Mês */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-white/5 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isCurrentMonthActive
                  ? "bg-[#b300e4] text-white shadow-xs font-bold"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
              title="Mês atual"
            >
              <span>Mês Atual</span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divisor */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
              Ou escolher datas
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Formulário Data a Data */}
          <form onSubmit={handleApplyCustom} className="pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400">De (Início)</label>
                <input
                  type="date"
                  required
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                  className="w-full h-9 px-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-medium focus:outline-none focus:border-[#b300e4] cursor-pointer scheme-dark"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400">Até (Fim)</label>
                <input
                  type="date"
                  required
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  className="w-full h-9 px-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-medium focus:outline-none focus:border-[#b300e4] cursor-pointer scheme-dark"
                />
              </div>
            </div>

            {/* Atalhos Rápidos */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => applyShortcut("today")}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("7days")}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("15days")}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                15 dias
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("thisMonth")}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => applyShortcut("lastMonth")}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Mês Passado
              </button>
            </div>

            {/* Botão Aplicar Período Personalizado */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full py-2 rounded-xl text-xs font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 text-white shadow-md shadow-[#b300e4]/20 transition-all cursor-pointer"
              >
                Aplicar Período
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
