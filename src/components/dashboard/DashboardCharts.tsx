"use client";

import React from "react";
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
      <div className="bg-[#18181b]/95 border border-border/80 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 animate-in fade-in zoom-in-95 z-50">
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{displayName}</p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <div 
            className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0" 
            style={{ backgroundColor: payload[0].color || data.color || "#b300e4" }} 
          />
          <span className="font-black text-white text-base tracking-tight tabular-nums">
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#242424" />
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
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#242424', opacity: 0.4 }} />
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

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

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
            >
              {coloredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Informação Centralizada no Buraco do Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="text-sm font-black text-foreground tabular-nums leading-tight">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(total)}
          </span>
        </div>
      </div>

      {/* Legenda Customizada com Percentual e Scroll Oculto */}
      <div className="w-full max-h-[90px] overflow-y-auto no-scrollbar flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2 px-1">
        {coloredData.map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div 
              key={i} 
              title={`${item.name}: ${formatBRL(item.value)} (${pct}%)`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default select-none"
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
