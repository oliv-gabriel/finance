const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;
const ENTRY_TYPES = ["unico", "fixa", "recorrente", "parcelado"] as const;
const RECURRENCE_FREQUENCIES = ["Mensal", "Bimestral", "Quinzenal"] as const;

type TransactionType = (typeof TRANSACTION_TYPES)[number];
type EntryType = (typeof ENTRY_TYPES)[number];
type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export type TransactionInput = {
  amount: number;
  description: string;
  date: Date;
  type: TransactionType;
  categoryId?: string | null;
  paid: boolean;
  accountId: string;
  destinationAccountId?: string | null;
  entryType?: EntryType;
  recurrenceFreq?: RecurrenceFrequency;
  quantity?: number;
  installmentValueType?: "total" | "parcela";
};

const isNonEmptyString = (value: unknown, maxLength = 100): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;

const isId = (value: unknown): value is string => isNonEmptyString(value, 64) && !/\s/.test(value);

export function validatePeriod(month: unknown, year: unknown): { month: number; year: number } | null {
  if (!Number.isInteger(month) || !Number.isInteger(year)) return null;
  if ((month as number) < 1 || (month as number) > 12) return null;
  if ((year as number) < 2000 || (year as number) > 2100) return null;
  return { month: month as number, year: year as number };
}

export function validateId(value: unknown): string | null {
  return isId(value) ? value.trim() : null;
}

export function validateTransactionInput(data: unknown): TransactionInput | null {
  if (!data || typeof data !== "object") return null;
  const input = data as Record<string, unknown>;
  const type = input.type as TransactionType;
  const entryType = input.entryType as EntryType | undefined;
  const recurrenceFreq = input.recurrenceFreq as RecurrenceFrequency | undefined;
  const amount = input.amount;
  const date = input.date;
  const quantity = input.quantity ?? 1;

  if (!TRANSACTION_TYPES.includes(type)) return null;
  if (!isNonEmptyString(input.description, 200)) return null;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return null;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  if (typeof input.paid !== "boolean" || !isId(input.accountId)) return null;
  if (entryType && !ENTRY_TYPES.includes(entryType)) return null;
  if (recurrenceFreq && !RECURRENCE_FREQUENCIES.includes(recurrenceFreq)) return null;
  if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 120) return null;
  if (input.installmentValueType && input.installmentValueType !== "total" && input.installmentValueType !== "parcela") return null;

  const categoryId = input.categoryId ? validateId(input.categoryId) : null;
  const destinationAccountId = input.destinationAccountId ? validateId(input.destinationAccountId) : null;
  if ((input.categoryId && !categoryId) || (input.destinationAccountId && !destinationAccountId)) return null;
  if (type === "TRANSFER") {
    if (!destinationAccountId || destinationAccountId === input.accountId) return null;
  } else if (!categoryId) {
    return null;
  }

  return {
    amount,
    description: input.description.trim(),
    date,
    type,
    categoryId,
    paid: input.paid,
    accountId: input.accountId.trim(),
    destinationAccountId,
    entryType,
    recurrenceFreq,
    quantity: quantity as number,
    installmentValueType: input.installmentValueType as "total" | "parcela" | undefined,
  };
}

export function validateCategoryInput(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const input = data as Record<string, unknown>;
  if (!isNonEmptyString(input.name, 80)) return null;
  if (typeof input.color !== "string" || !/^#[0-9a-f]{6}$/i.test(input.color)) return null;
  if (!isNonEmptyString(input.icon, 50)) return null;
  return { name: input.name.trim(), color: input.color, icon: input.icon };
}

export function validateAccountInput(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const input = data as Record<string, unknown>;
  if (!isNonEmptyString(input.name, 80) || (input.type !== "CONTA" && input.type !== "CARTAO")) return null;
  if (typeof input.includeInTotal !== "boolean") return null;
  const isCard = input.type === "CARTAO";
  const limit = input.limit ?? 0;
  const closingDay = input.closingDay;
  const dueDay = input.dueDay;
  if (isCard && (!isId(input.bankId) || typeof limit !== "number" || !Number.isFinite(limit) || limit < 0 || limit > 100_000_000 || !Number.isInteger(closingDay) || !Number.isInteger(dueDay) || (closingDay as number) < 1 || (closingDay as number) > 31 || (dueDay as number) < 1 || (dueDay as number) > 31)) return null;
  return {
    name: input.name.trim(),
    type: input.type,
    bankId: isCard ? (input.bankId as string).trim() : null,
    limit: isCard ? limit as number : 0,
    closingDay: isCard ? closingDay as number : null,
    dueDay: isCard ? dueDay as number : null,
    includeInTotal: input.includeInTotal,
  };
}

export function validateBudgetInput(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const input = data as Record<string, unknown>;
  const period = validatePeriod(input.month, input.year);
  if (!period || !isId(input.categoryId) || typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount < 0 || input.amount > 100_000_000) return null;
  return { ...period, categoryId: input.categoryId.trim(), amount: input.amount };
}
