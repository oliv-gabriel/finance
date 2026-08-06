"use server";

import { prisma } from "@/lib/prisma";
import { getAccountBillingCycle, getTransactionWhereForMonth } from "@/lib/billingCycles";

export async function getDashboardData(month?: number, year?: number) {
  try {
    const now = new Date();
    const targetMonth = month ?? (now.getMonth() + 1);
    const targetYear = year ?? now.getFullYear();

    const allAccounts = await prisma.account.findMany();
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const whereClause = getTransactionWhereForMonth(targetMonth, targetYear, allAccounts);

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
      },
    });

    const includedTransactions = transactions.filter(
      (t) => t.account?.includeInTotal !== false
    );

    const income = includedTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expenses = includedTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const paidIncome = includedTransactions
      .filter((t) => t.type === "INCOME" && t.paid)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pendingIncome = includedTransactions
      .filter((t) => t.type === "INCOME" && !t.paid)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const paidExpenses = includedTransactions
      .filter((t) => t.type === "EXPENSE" && t.paid)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const pendingExpenses = includedTransactions
      .filter((t) => t.type === "EXPENSE" && !t.paid)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = paidIncome - paidExpenses;
    const effectiveBalance = paidIncome - paidExpenses;
    const liquidationDiff = paidExpenses - pendingExpenses;

    // Daily expenses for chart
    const dailyExpenses = new Array(endDate.getDate()).fill(0).map((_, i) => ({
      day: i + 1,
      amount: 0,
    }));

    includedTransactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const day = new Date(t.date).getDate();
        dailyExpenses[day - 1].amount += t.amount;
      });

    // Category distribution
    const categories = await prisma.category.findMany();
    const categoryDistribution = categories.map((cat) => {
      const amount = includedTransactions
        .filter((t) => t.categoryId === cat.id && t.type === "EXPENSE")
        .reduce((acc, curr) => acc + curr.amount, 0);
      
      return {
        name: cat.name,
        value: amount,
        color: cat.color,
      };
    }).filter(item => item.value > 0);

    return {
      summary: {
        income,
        expenses,
        balance,
        paidIncome,
        pendingIncome,
        paidExpenses,
        pendingExpenses,
        effectiveBalance,
        liquidationDiff,
      },
      dailyExpenses,
      categoryDistribution,
      accounts: await (async () => {
        const contas = await prisma.account.findMany({ where: { type: "CONTA" } });
        if (contas.length === 0) return [];
        const balances = await prisma.transaction.groupBy({
          by: ['accountId', 'type'],
          where: { paid: true, accountId: { in: contas.map(c => c.id) } },
          _sum: { amount: true }
        });
        return contas.map(acc => {
          const inc = balances.find(b => b.accountId === acc.id && b.type === "INCOME")?._sum.amount || 0;
          const exp = balances.find(b => b.accountId === acc.id && b.type === "EXPENSE")?._sum.amount || 0;
          return {
            id: acc.id,
            name: acc.name,
            balance: inc - exp,
            type: acc.type,
            includeInTotal: acc.includeInTotal,
          };
        });
      })(),
      creditCards: await (async () => {
        const cartoes = await prisma.account.findMany({ where: { type: "CARTAO" } });
        if (cartoes.length === 0) return [];
        const allUnpaid = await prisma.transaction.groupBy({
          by: ['accountId'],
          where: { paid: false, type: "EXPENSE", accountId: { in: cartoes.map(c => c.id) } },
          _sum: { amount: true }
        });
        return Promise.all(cartoes.map(async (card) => {
          const { startDate: cardStart, endDate: cardEnd } = getAccountBillingCycle(card, targetMonth, targetYear);
          const currentInvoice = await prisma.transaction.aggregate({
            where: { accountId: card.id, date: { gte: cardStart, lte: cardEnd }, type: "EXPENSE" },
            _sum: { amount: true }
          });
          const faturaAtual = currentInvoice._sum.amount || 0;
          
          const unpaidCount = await prisma.transaction.count({
            where: { accountId: card.id, date: { gte: cardStart, lte: cardEnd }, type: "EXPENSE", paid: false }
          });
          const hasUnpaid = unpaidCount > 0;
          
          const totalTransactionsCount = await prisma.transaction.count({
            where: { accountId: card.id, date: { gte: cardStart, lte: cardEnd } }
          });
          
          const allUnpaidExpenses = allUnpaid.find(u => u.accountId === card.id)?._sum.amount || 0;
          const limiteDisponivel = (card.limit || 0) - allUnpaidExpenses;
          
          const isCurrentMonth = targetMonth === (now.getMonth() + 1) && targetYear === now.getFullYear();
          let status = "Fechado";
          
          if (!hasUnpaid && totalTransactionsCount > 0) {
            status = "Fechado";
          } else if (isCurrentMonth) {
            const today = now.getDate();
            status = today <= (card.closingDay || 31) ? "Aberto" : "Fechado";
          } else if (targetYear > now.getFullYear() || (targetYear === now.getFullYear() && targetMonth > now.getMonth() + 1)) {
            status = "Aberto";
          }

          return {
            id: card.id,
            name: card.name,
            faturaAtual,
            limiteDisponivel,
            closingDay: card.closingDay,
            dueDay: card.dueDay,
            status,
            includeInTotal: card.includeInTotal,
          };
        }));
      })()
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      summary: { 
        income: 0, 
        expenses: 0, 
        balance: 0,
        paidIncome: 0,
        pendingIncome: 0,
        paidExpenses: 0,
        pendingExpenses: 0,
        effectiveBalance: 0,
        liquidationDiff: 0,
      },
      dailyExpenses: [],
      categoryDistribution: [],
      accounts: [],
      creditCards: [],
    };
  }
}

