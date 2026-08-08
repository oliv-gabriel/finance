import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: "Alimentação", color: "#ef4444", icon: "Utensils" },
  { name: "Moradia", color: "#3b82f6", icon: "Home" },
  { name: "Transporte", color: "#f59e0b", icon: "Car" },
  { name: "Saúde", color: "#10b981", icon: "HeartPulse" },
  { name: "Educação", color: "#8b5cf6", icon: "GraduationCap" },
  { name: "Lazer e Hobbies", color: "#ec4899", icon: "Gamepad2" },
  { name: "Compras", color: "#f97316", icon: "ShoppingBag" },
  { name: "Mercado", color: "#ea580c", icon: "ShoppingBag" },
  { name: "Viagem", color: "#06b6d4", icon: "Plane" },
  { name: "Assinaturas e TV", color: "#6366f1", icon: "Smartphone" },
  { name: "Investimentos", color: "#14b8a6", icon: "DollarSign" },
  { name: "Salário e Renda", color: "#22c55e", icon: "DollarSign" },
  { name: "Bares e Restaurantes", color: "#be185d", icon: "Wine" },
  { name: "Pets", color: "#a855f7", icon: "Tag" },
  { name: "Cuidados Pessoais", color: "#f43f5e", icon: "HeartPulse" },
  { name: "Serviços", color: "#64748b", icon: "Tag" },
  { name: "Presentes", color: "#fbbf24", icon: "Tag" },
  { name: "Impostos e Taxas", color: "#78716c", icon: "Tag" }
];

async function main() {
  const existingCategories = await prisma.category.findMany();
  const existingNames = existingCategories.map(c => c.name.toLowerCase());

  let addedCount = 0;
  for (const cat of categories) {
    if (!existingNames.includes(cat.name.toLowerCase())) {
      await prisma.category.create({
        data: cat
      });
      console.log(`Criado: ${cat.name}`);
      addedCount++;
    } else {
      console.log(`Já existe: ${cat.name}`);
    }
  }
  console.log(`\nFinalizado! ${addedCount} novas categorias foram adicionadas.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
