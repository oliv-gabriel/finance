interface AccountLike {
    id?: string;
    type?: string | null;
    closingDay?: number | null;
}

export function getAccountBillingCycle(account: AccountLike, month: number, year: number) {
    if (account && account.type === "CARTAO" && account.closingDay && account.closingDay > 0 && account.closingDay <= 31) {
        // Para a fatura do mês M, o ciclo começa no dia seguinte ao fechamento do mês anterior (M-1)
        // No construtor de Date do JS, mês é zero-indexed: (month - 2) = M-1, (month - 1) = M.
        const startDate = new Date(year, month - 2, account.closingDay + 1, 0, 0, 0, 0);
        const endDate = new Date(year, month - 1, account.closingDay, 23, 59, 59, 999);
        return { startDate, endDate };
    }

    // Para contas normais ou cartões sem dia de fechamento configurado, usamos o mês civil padrão
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
}

export function getTransactionWhereForMonth(month: number, year: number, accounts: AccountLike[]) {
    const cardAccountIds: string[] = [];
    const orConditions: any[] = [];

    const defaultStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const defaultEnd = new Date(year, month, 0, 23, 59, 59, 999);

    for (const acc of accounts) {
        if (acc.type === "CARTAO" && acc.closingDay && acc.closingDay > 0 && acc.closingDay <= 31 && acc.id) {
            cardAccountIds.push(acc.id);
            const cardStart = new Date(year, month - 2, acc.closingDay + 1, 0, 0, 0, 0);
            const cardEnd = new Date(year, month - 1, acc.closingDay, 23, 59, 59, 999);
            orConditions.push({
                accountId: acc.id,
                date: { gte: cardStart, lte: cardEnd }
            });
        }
    }

    if (cardAccountIds.length > 0) {
        orConditions.push({
            OR: [
                { accountId: { notIn: cardAccountIds } },
                { accountId: null }
            ],
            date: { gte: defaultStart, lte: defaultEnd }
        });
        return { OR: orConditions };
    }

    return { date: { gte: defaultStart, lte: defaultEnd } };
}
