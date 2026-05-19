export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isExpiringSoon(expiryDateIso: string | null): boolean {
  if (!expiryDateIso) return false;
  const diff = new Date(expiryDateIso).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}
