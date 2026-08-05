import { getCategories } from "@/app/actions/categories";
import { getDashboardData } from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, Tag } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const categories = await getCategories();
  const data = await getDashboardData(month, year);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212]">
      <Navbar summary={data.summary} />
      
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias para organizar seus gastos e receitas.
            </p>
          </div>
          <Link href="/categories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="h-3.5 w-3.5 rounded-full shadow-2xs shrink-0" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-base font-semibold tracking-tight text-foreground truncate">
                      {category.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg w-fit text-xs font-medium border border-border/40">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ícone: <strong className="font-semibold text-foreground">{category.icon}</strong></span>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Link href={`/categories/edit/${category.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium rounded-lg px-3">
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground mb-4">Comece criando sua primeira categoria para organizar suas finanças.</p>
              <Link href="/categories/new">
                <Button>Criar Categoria</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
