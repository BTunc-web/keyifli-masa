export function generateSlug(text: string): string {
  const turkishMap: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return text
    .toLowerCase()
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => turkishMap[match] || match)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  const c = phone.replace(/\D/g, "");
  if (c.length === 10) {
    return `(${c.slice(0, 3)}) ${c.slice(3, 6)} ${c.slice(6, 8)} ${c.slice(8)}`;
  }
  return phone;
}