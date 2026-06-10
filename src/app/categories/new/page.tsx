"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const ICON_OPTIONS = [
  "Utensils", "Car", "Gamepad2", "Heart", "BookOpen", "Home", "DollarSign", "ShoppingBag", "Plane", "Zap"
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    icon: "Tag",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    
    const result = await createCategory(formData);
    
    if (result.success) {
      router.push("/categories");
    } else {
      alert(result.error);
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/categories" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nova Categoria</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                required
                placeholder="Ex: Supermercado"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cor</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    className="w-12 p-1 h-10"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <span className="text-sm font-mono">{formData.color}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Ícone</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  <option value="Tag">Padrão (Tag)</option>
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t p-6">
            <Link href="/categories">
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar Categoria"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
