const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log("No users found to assign data to.");
    return;
  }
  
  const user = users[0];
  console.log(`Assigning all data to user: ${user.name} (${user.email}) - ID: ${user.id}`);

  const accountsRes = await prisma.account.updateMany({
    where: { userId: null },
    data: { userId: user.id }
  });
  console.log(`Updated ${accountsRes.count} accounts.`);

  const txRes = await prisma.transaction.updateMany({
    where: { userId: null },
    data: { userId: user.id }
  });
  console.log(`Updated ${txRes.count} transactions.`);

  const budgetRes = await prisma.budget.updateMany({
    where: { userId: null },
    data: { userId: user.id }
  });
  console.log(`Updated ${budgetRes.count} budgets.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
