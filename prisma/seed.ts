import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const categories = [
    { name: "Alimentação", color: "#ef4444", icon: "Utensils" },
    { name: "Transporte", color: "#3b82f6", icon: "Car" },
    { name: "Lazer", color: "#10b981", icon: "Gamepad2" },
    { name: "Saúde", color: "#f59e0b", icon: "Heart" },
    { name: "Educação", color: "#6366f1", icon: "BookOpen" },
    { name: "Moradia", color: "#8b5cf6", icon: "Home" },
    { name: "Salário", color: "#22c55e", icon: "DollarSign" },
    { name: "Outros", color: "#94a3b8", icon: "MoreHorizontal" },
  ];

  console.log("Seeding categories...");

  try {
    const count = await prisma.category.count();
    if (count === 0) {
      for (const category of categories) {
          await prisma.category.create({ data: category });
      }
      console.log("Categories seeded!");
    } else {
      console.log("Categories already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
