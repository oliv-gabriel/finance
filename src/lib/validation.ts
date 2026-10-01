import { z } from "zod";

const TransactionTypeEnum = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
const EntryTypeEnum = z.enum(["unico", "fixa", "recorrente", "parcelado"]);
const RecurrenceFrequencyEnum = z.enum(["Mensal", "Bimestral", "Quinzenal"]);

export const transactionSchema = z.object({
  amount: z.number().positive().max(100_000_000),
  description: z.string().min(1).max(200).trim(),
  date: z.coerce.date(),
  type: TransactionTypeEnum,
  categoryId: z.preprocess(val => val === "" ? null : val, z.string().min(1).max(64).regex(/^\S+$/).optional().nullable()),
  paid: z.boolean(),
  accountId: z.string().min(1).max(64).regex(/^\S+$/),
  destinationAccountId: z.preprocess(val => val === "" ? null : val, z.string().min(1).max(64).regex(/^\S+$/).optional().nullable()),
  entryType: EntryTypeEnum.optional(),
  recurrenceFreq: RecurrenceFrequencyEnum.optional(),
  quantity: z.number().int().min(1).max(120).optional().default(1),
  installmentValueType: z.enum(["total", "parcela"]).optional(),
}).refine(data => {
  if (data.type === "TRANSFER") {
    return data.destinationAccountId && data.destinationAccountId !== data.accountId;
  }
  return !!data.categoryId;
}, { message: "Invalid category or destination account" });

export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(1).max(80).trim(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: z.string().min(1).max(50),
});

export const accountSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  type: z.enum(["CONTA", "CARTAO"]),
  includeInTotal: z.boolean(),
  bankId: z.string().min(1).max(64).regex(/^\S+$/).optional().nullable(),
  limit: z.number().min(0).max(100_000_000).optional(),
  closingDay: z.number().int().min(1).max(31).optional().nullable(),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
}).refine(data => {
  if (data.type === "CARTAO") {
    return !!data.bankId && data.limit !== undefined && !!data.closingDay && !!data.dueDay;
  }
  return true;
}, { message: "Invalid card details" });

export const budgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  categoryId: z.string().min(1).max(64).regex(/^\S+$/),
  amount: z.number().min(0).max(100_000_000),
});

export function validatePeriod(month: unknown, year: unknown): { month: number; year: number } | null {
  const result = z.object({ month: z.number().int().min(1).max(12), year: z.number().int().min(2000).max(2100) }).safeParse({ month, year });
  return result.success ? result.data : null;
}

export function validateId(value: unknown): string | null {
  const result = z.string().min(1).max(64).regex(/^\S+$/).safeParse(value);
  return result.success ? result.data : null;
}

export function validateTransactionInput(data: unknown): { success: true; data: TransactionInput } | { success: false; error: string } {
  const result = transactionSchema.safeParse(data);
  if (!result.success) {
    console.error("Zod Error:", result.error);
    return { success: false, error: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') };
  }
  return { success: true, data: result.data };
}

export function validateCategoryInput(data: unknown) {
  const result = categorySchema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateAccountInput(data: unknown) {
  const result = accountSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateBudgetInput(data: unknown) {
  const result = budgetSchema.safeParse(data);
  return result.success ? result.data : null;
}
