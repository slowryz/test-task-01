export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeRussiaPhoneDigits(digits: string): string {
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  return digits;
}
