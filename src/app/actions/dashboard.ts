"use server";

import { prisma } from "@/lib/prisma";
import { getTransactionWhereForMonth, getAccountBillingCycle } from "@/lib/billingCycles";
import { toNumber } from "@/lib/money";
import { getCurrentUserId } from "@/lib/auth-utils";

export async function getDashboardData(
  month?: number, 
  year?: number, 
  startDateStr?: string, 
  endDateStr?: string
) {
  try {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();

    const startStr = startDateStr || (month && year ? `${year}-${pad(month)}-01` : `${currentYear}-${pad(currentMonth)}-01`);
    const endStr = endDateStr || (month && year ? `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}` : `${currentYear}-${pad(currentMonth)}-${pad(lastDay)}`);

    const startDate = new Date(startStr + "T00:00:00.000");
    const endDate = new Date(endStr + "T23:59:59.999");
    const targetMonth = startDate.getMonth() + 1;
    const targetYear = startDate.getFullYear();

    const userId = await getCurrentUserId();

    const allAccounts = await prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        limit: true,
        closingDay: true,
        dueDay: true,
        includeInTotal: true,
      },
    });

    const isSingleMonth =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth();

    const whereClause = isSingleMonth
      ? getTransactionWhereForMonth(targetMonth, targetYear, allAccounts)
      : { date: { gte: startDate, lte: endDate } };
    const contas = allAccounts.filter((account) => account.type === "CONTA");
    const cartoes = allAccounts.filter((account) => account.type === "CARTAO");
    const contaIds = contas.map((account) => account.id);
    const cartaoIds = cartoes.map((account) => account.id);

    // Once the account list is known, the remaining database work is independent.
    const [transactions, balances, transfersIn, categories, allUnpaid] = await Promise.all([
      prisma.transaction.findMany({
        where: { ...whereClause, userId },
        select: {
          amount: true,
          date: true,
          type: true,
          paid: true,
          accountId: true,
          categoryId: true,
        },
      }),
      prisma.transaction.groupBy({
        by: ["accountId", "type"],
        where: { userId, paid: true, accountId: { in: contaIds } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["destinationAccountId"],
        where: {
          userId,
          paid: true,
          type: "TRANSFER",
          destinationAccountId: { in: contaIds },
        },
        _sum: { amount: true },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, color: true },
      }),
      prisma.transaction.groupBy({
        by: ["accountId"],
        where: {
          userId,
          paid: false,
          type: "EXPENSE",
          accountId: { in: cartaoIds },
        },
        _sum: { amount: true },
      }),
    ]);

    const accountIncluded = new Map(
      allAccounts.map((account) => [account.id, account.includeInTotal])
    );

    const daysCount = isSingleMonth
      ? new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
      : Math.max(1, Math.min(62, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));

    const dailyExpenses = Array.from({ length: daysCount }, (_, index) => ({
      day: index + 1,
      amount: 0,
    }));
    const categoryExpenses = new Map<string, number>();
    const cardStats = new Map(
      cartoes.map((card) => [
        card.id,
        { invoice: 0, hasUnpaid: false, transactionCount: 0 },
      ])
    );

    let income = 0;
    let expenses = 0;
    let paidIncome = 0;
    let pendingIncome = 0;
    let paidExpenses = 0;
    let pendingExpenses = 0;

    for (const transaction of transactions) {
      const amount = toNumber(transaction.amount);
      const stats = transaction.accountId
        ? cardStats.get(transaction.accountId)
        : undefined;

      if (stats) {
        stats.transactionCount += 1;
        if (transaction.type === "EXPENSE") {
          stats.invoice += amount;
          stats.hasUnpaid ||= !transaction.paid;
        }
      }

      if (
        transaction.accountId &&
        accountIncluded.get(transaction.accountId) === false
      ) {
        continue;
      }

      if (transaction.type === "INCOME") {
        income += amount;
        if (transaction.paid) paidIncome += amount;
        else pendingIncome += amount;
        continue;
      }

      if (transaction.type !== "EXPENSE") continue;

      expenses += amount;
      if (transaction.paid) paidExpenses += amount;
      else pendingExpenses += amount;

      if (transaction.categoryId) {
        categoryExpenses.set(
          transaction.categoryId,
          (categoryExpenses.get(transaction.categoryId) ?? 0) + amount
        );
      }

      // Credit-card billing cycles can include dates from an adjacent month.
      // Only civil-month dates belong on this chart, avoiding an invalid day index.
      if (transaction.date >= startDate && transaction.date <= endDate) {
        const dayIdx = isSingleMonth
          ? transaction.date.getDate() - 1
          : Math.floor((transaction.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dailyExpenses[dayIdx]) {
          dailyExpenses[dayIdx].amount += amount;
        }
      }
    }

    const balanceByAccount = new Map<string, Map<string, number>>();
    for (const item of balances) {
      if (!item.accountId) continue;
      const values = balanceByAccount.get(item.accountId) ?? new Map<string, number>();
      values.set(item.type, toNumber(item._sum.amount));
      balanceByAccount.set(item.accountId, values);
    }

    const transfersInByAccount = new Map(
      transfersIn
        .filter((item) => item.destinationAccountId)
        .map((item) => [item.destinationAccountId as string, toNumber(item._sum.amount)])
    );

    const accountsData = contas.map((acc) => {
      const values = balanceByAccount.get(acc.id);
      const inc = values?.get("INCOME") ?? 0;
      const exp = values?.get("EXPENSE") ?? 0;
      const tOut = values?.get("TRANSFER") ?? 0;
      const tIn = transfersInByAccount.get(acc.id) ?? 0;
      return {
        id: acc.id,
        name: acc.name,
        balance: inc - exp - tOut + tIn,
        type: acc.type,
        includeInTotal: acc.includeInTotal,
      };
    });

    const balance = accountsData
      .filter(a => a.includeInTotal !== false)
      .reduce((sum, acc) => sum + acc.balance, 0);

    const effectiveBalance = balance;
    const liquidationDiff = paidExpenses - pendingExpenses;

    const categoryDistribution = categories
      .map((cat) => ({
        name: cat.name,
        value: categoryExpenses.get(cat.id) ?? 0,
        color: cat.color,
      }))
      .filter((item) => item.value > 0);

    const allUnpaidByCard = new Map(
      allUnpaid
        .filter((item) => item.accountId)
        .map((item) => [item.accountId as string, toNumber(item._sum.amount)])
    );

    const MONTH_NAMES = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const creditCards = await Promise.all(
      cartoes.map(async (card) => {
        const stats = cardStats.get(card.id)!;
        const limiteDisponivel =
          toNumber(card.limit) - (allUnpaidByCard.get(card.id) ?? 0);
        const { startDate: cycleStart, endDate: cycleEnd } = getAccountBillingCycle(card, targetMonth, targetYear);

        const isPaid = !stats.hasUnpaid && stats.transactionCount > 0;
        let status = "Fechado";
        if (isPaid) {
          status = "Paga";
        } else if (now <= cycleEnd) {
          status = "Aberto";
        } else {
          status = "Fechado";
        }

        let nextInvoice = 0;
        const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
        const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;

        if (now > cycleEnd) {
          const { startDate: nextStart, endDate: nextEnd } = getAccountBillingCycle(card, nextMonth, nextYear);
          const nextTxs = await prisma.transaction.aggregate({
            where: {
              userId,
              accountId: card.id,
              date: { gte: nextStart, lte: nextEnd },
              type: "EXPENSE",
            },
            _sum: { amount: true },
          });
          nextInvoice = toNumber(nextTxs._sum.amount);
        }

        return {
          id: card.id,
          name: card.name,
          faturaAtual: stats.invoice,
          proximaFatura: nextInvoice,
          proximoMesNome: MONTH_NAMES[nextMonth - 1],
          limiteDisponivel,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          status,
          isPaid,
          includeInTotal: card.includeInTotal,
          cycleStartDate: cycleStart.toISOString(),
          cycleEndDate: cycleEnd.toISOString(),
        };
      })
    );

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
      accounts: accountsData,
      creditCards,
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

