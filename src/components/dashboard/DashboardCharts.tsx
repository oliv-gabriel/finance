"use client";

import React, { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const VIBRANT_PALETTE = [
  "#b300e4", // Roxo destaque
  "#f97316", // Laranja
  "#3b82f6", // Azul
  "#10b981", // Esmeralda
  "#ec4899", // Rosa
  "#eab308", // Amarelo
  "#06b6d4", // Ciano
  "#8b5cf6", // Violeta
  "#ef4444", // Vermelho
  "#14b8a6", // Ciano esverdeado
  "#6366f1", // Índigo
  "#f43f5e", // Rose
  "#84cc16", // Verde limão
  "#a855f7", // Púrpura
  "#64748b", // Ardósia
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const displayName = label 
      ? (String(label).includes("Dia") ? label : `Dia ${label}`) 
      : (data.name || "Gasto");
    const val = Number(payload[0].value) || 0;
    
    return (
      <div className="bg-card/95 border border-border backdrop-blur-md p-3.5 rounded-2xl shadow-xl flex flex-col gap-1.5 animate-in fade-in zoom-in-95 z-50 text-foreground">
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{displayName}</p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <div 
            className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0" 
            style={{ backgroundColor: payload[0].color || data.color || "#b300e4" }} 
          />
          <span className="font-black text-foreground text-base tracking-tight tabular-nums">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function ExpensesBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.7} />
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 11, fill: "#71717a", fontWeight: 700 }} 
          tickLine={false} 
          axisLine={false} 
          tickMargin={10}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `R$${value}`}
          tickMargin={10}
        />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.35 }} />
        <Bar 
          dataKey="amount" 
          fill="#b300e4" 
          radius={[6, 6, 0, 0]} 
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoriesPieChart({ data }: { data: any[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground font-medium">
        Nenhuma despesa registrada no período.
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const total = sortedData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  const coloredData = sortedData.map((item, index) => ({
    ...item,
    color: VIBRANT_PALETTE[index % VIBRANT_PALETTE.length],
  }));

  const formatBRL = (val: number, hideCents = false) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: hideCents ? 0 : 2,
    }).format(val);

  const activeItem = activeIndex !== null ? coloredData[activeIndex] : null;
  const activePct = activeItem && total > 0 ? Math.round((activeItem.value / total) * 100) : 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between">
      {/* Gráfico Donut sem distorção e perfeitamente circular */}
      <div className="relative w-full h-[200px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              stroke="#191919"
              strokeWidth={2}
              animationDuration={1000}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {coloredData.map((entry, index) => {
                const isHovered = activeIndex === index;
                const isDimmed = activeIndex !== null && !isHovered;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    opacity={isDimmed ? 0.35 : 1}
                    stroke={isHovered ? "#ffffff" : "#191919"}
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-200 cursor-pointer outline-none"
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Informação Centralizada no Buraco do Donut (HUB Dinâmico sem colisão) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-3">
          {activeItem ? (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-150">
              <span 
                className="text-[10px] font-black uppercase tracking-wider truncate max-w-[110px]"
                style={{ color: activeItem.color }}
              >
                {activeItem.name}
              </span>
              <span className="text-xs sm:text-sm font-black text-white tabular-nums leading-tight mt-0.5">
                {formatBRL(activeItem.value)}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 tabular-nums">
                {activePct}% do total
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="text-sm font-black text-foreground tabular-nums leading-tight">
                {formatBRL(total, true)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legenda Customizada com Percentual e Efeito Hover Interativo */}
      <div className="w-full max-h-[90px] overflow-y-auto no-scrollbar flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 pt-2 px-1">
        {coloredData.map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const isCurrent = activeIndex === i;
          return (
            <div 
              key={i} 
              title={`${item.name}: ${formatBRL(item.value)} (${pct}%)`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-lg transition-all duration-200 cursor-pointer select-none ${
                isCurrent
                  ? "bg-white/10 text-white font-semibold shadow-xs"
                  : activeIndex !== null
                  ? "opacity-35 text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate max-w-[120px] font-medium text-[11px]">{item.name}</span>
              <span className="text-foreground/50 text-[10px] font-bold tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
