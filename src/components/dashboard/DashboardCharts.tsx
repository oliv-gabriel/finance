"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Para BarChart o label é o dia. Para PieChart usamos o nome da categoria.
    const displayName = label ? (String(label).includes("Dia") ? label : `Dia ${label}`) : (data.name || "Gasto");
    
    return (
      <div className="bg-[#18181b]/95 border border-border/80 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{displayName}</p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <div 
            className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
            style={{ backgroundColor: payload[0].color || data.color || "#b300e4" }} 
          />
          <span className="font-black text-white text-lg tracking-tight tabular-nums">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payload[0].value)}
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
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={105}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
          animationDuration={1500}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || "#b300e4"} 
              style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" }}
            />
          ))}
        </Pie>
        <RechartsTooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={40} 
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs font-bold text-muted-foreground ml-1">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
