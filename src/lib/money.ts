type DecimalLike = { toNumber(): number };

/** Converte valores do Prisma Decimal em números próprios para a interface. */
export function toNumber(value: number | DecimalLike | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

/** Arredonda qualquer valor monetário para dois centavos antes de persistir. */
export function toCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
