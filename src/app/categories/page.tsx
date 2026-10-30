import { getCategories } from "@/app/actions/categories";
import { getDashboardData } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, Tag } from "lucide-react";
import { getCategoryIconComponent } from "@/lib/icons";
import Link from "next/link";
import { isAdmin } from "@/lib/auth-utils";
import Navbar from "@/components/Navbar";


export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const admin = await isAdmin();
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const [categories, data] = await Promise.all([
    getCategories(),
    getDashboardData(month, year),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar summary={data.summary} isAdmin={admin} />
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 flex-1 overflow-auto">
        
        {/* Header da Página */}
        <div className="bg-card border border-border/70 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#b300e4]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-sky-500/10 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-[#b300e4]/20 flex items-center justify-center text-[#b300e4] shadow-sm">
                <Tag className="w-5 h-5 stroke-[2.5]" />
              </div>
              Categorias
            </h1>
          </div>
          
          <Link href="/categories/new" className="relative z-10 shrink-0">
            <button className="flex w-full md:w-auto items-center justify-center gap-2 rounded-full font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-lg shadow-[#b300e4]/20 transition-all text-white px-6 py-3 cursor-pointer hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 stroke-[3]" />
              Nova Categoria
            </button>
          </Link>
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {categories.map((category) => {
            const IconComp = getCategoryIconComponent(category.name);
            return (
              <div 
                key={category.id} 
                className="group relative bg-card border border-border hover:border-[#b300e4]/40 rounded-3xl p-5 shadow-xs hover:shadow-md hover:shadow-[#b300e4]/5 transition-all duration-300 flex items-center justify-between overflow-hidden cursor-default"
              >
                {/* Glow de fundo no hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at right center, ${category.color} 0%, transparent 70%)` }}
                />

                <div className="flex items-center gap-4 relative z-10 min-w-0">
                  <div 
                    className="size-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: category.color || "#b300e4" }}
                  >
                    <IconComp className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-lg font-extrabold tracking-tight text-foreground truncate group-hover:text-[#b300e4] transition-colors">
                      {category.name}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-70">
                      Personalizada
                    </span>
                  </div>
                </div>

                <div className="relative z-10 shrink-0">
                  <Link href={`/categories/edit/${category.id}`}>
                    <button 
                      title="Editar categoria"
                      className="size-10 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-[#b300e4]/15 hover:text-[#b300e4] transition-colors cursor-pointer border border-transparent hover:border-[#b300e4]/30"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
          
          {categories.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/10">
              <div className="size-16 rounded-3xl bg-muted flex items-center justify-center mb-5 text-muted-foreground">
                <Tag className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                As categorias ajudam você a entender melhor os seus gastos. Crie a sua primeira categoria para começar.
              </p>
              <Link href="/categories/new" className="mt-6">
                <button className="flex items-center justify-center gap-2 rounded-full font-bold bg-[#b300e4] hover:bg-[#b300e4]/90 shadow-md shadow-[#b300e4]/20 transition-all text-white px-6 py-2.5 cursor-pointer">
                  Criar Categoria
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
