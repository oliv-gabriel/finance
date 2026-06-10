"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const now = new Date();
  const currentMonth = searchParams.get("month") || (now.getMonth() + 1).toString();
  const currentYear = searchParams.get("year") || now.getFullYear().toString();

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const years = [];
  const startYear = 2020;
  const endYear = now.getFullYear() + 2;
  for (let i = startYear; i <= endYear; i++) {
    years.push(i.toString());
  }

  const handleFilterChange = (month: string, year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    params.set("year", year);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg border shadow-sm">
      <Calendar className="h-4 w-4 text-muted-foreground ml-1" />
      <select
        value={currentMonth}
        onChange={(e) => handleFilterChange(e.target.value, currentYear)}
        className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <div className="w-px h-4 bg-border mx-1" />
      <select
        value={currentYear}
        onChange={(e) => handleFilterChange(currentMonth, e.target.value)}
        className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
