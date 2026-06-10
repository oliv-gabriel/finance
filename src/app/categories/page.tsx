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
    <div className="flex flex-col min-h-screen">
      <Navbar summary={data.summary} />
      
      <div className="p-8 space-y-6 flex-1 overflow-auto">
        <div className="flex items-center justify-between">
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
            <Card key={category.id} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {category.name}
                </CardTitle>
                <div 
                  className="h-4 w-4 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="text-xs uppercase font-semibold">Ícone: {category.icon}</span>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Link href={`/categories/edit/${category.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
