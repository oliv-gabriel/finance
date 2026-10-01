import { validateTransactionInput } from "./src/lib/validation";

const payload = {
  description: "Mercado",
  amount: 150.50,
  date: new Date("2026-09-29T12:00:00"),
  type: "EXPENSE",
  categoryId: "cuid123456789012345678901",
  paid: true,
  accountId: "cuid123456789012345678902",
  destinationAccountId: "",
  entryType: "unico",
  recurrenceFreq: "Mensal",
  quantity: 1,
  installmentValueType: "total"
};

const result = validateTransactionInput(payload);
console.log("Validation result:", result);
