export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}
