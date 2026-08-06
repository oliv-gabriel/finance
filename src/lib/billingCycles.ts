interface AccountLike {
    id?: string;
    type?: string | null;
    closingDay?: number | null;
    dueDay?: number | null;
}

export function getAccountBillingCycle(account: AccountLike, month: number, year: number) {
    if (account && account.type === "CARTAO" && account.closingDay && account.closingDay > 0 && account.closingDay <= 31) {
        // No sistema financeiro brasileiro, a fatura é referenciada pelo seu mês de VENCIMENTO.
        // Se o dia de vencimento for menor ou igual ao dia de fechamento (ex: fecha dia 20 e vence dia 10 do mês seguinte),
        // significa que o fechamento da fatura do mês M acontece no mês ANTERIOR ao vencimento (M-1).
        const closesInPreviousMonth = account.dueDay && account.dueDay <= account.closingDay;

        if (closesInPreviousMonth) {
            // Fatura com vencimento no mês M: fecha no mês M-1 (dia de fechamento) e inicia no mês M-2 (fechamento + 1)
            // No construtor de Date, mês é 0-indexed: (month - 3) = M-2, (month - 2) = M-1
            const startDate = new Date(year, month - 3, account.closingDay + 1, 0, 0, 0, 0);
            const endDate = new Date(year, month - 2, account.closingDay, 23, 59, 59, 999);
            return { startDate, endDate };
        } else {
            // Fatura com vencimento no mês M e fechamento no próprio mês M (ex: fecha dia 13 e vence dia 20 do mesmo mês)
            // No construtor de Date: (month - 2) = M-1, (month - 1) = M
            const startDate = new Date(year, month - 2, account.closingDay + 1, 0, 0, 0, 0);
            const endDate = new Date(year, month - 1, account.closingDay, 23, 59, 59, 999);
            return { startDate, endDate };
        }
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
            const { startDate, endDate } = getAccountBillingCycle(acc, month, year);
            orConditions.push({
                accountId: acc.id,
                date: { gte: startDate, lte: endDate }
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
