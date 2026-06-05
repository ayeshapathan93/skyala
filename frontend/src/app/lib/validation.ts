export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required`;
  return null;
}

export function validatePhone(value: string, required = false): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? "Phone number is required" : null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 12) return "Enter a valid 10-digit phone number";
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address";
  return null;
}

export function validatePositiveNumber(value: string, label: string, required = true): string | null {
  if (!value.trim()) return required ? `${label} is required` : null;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return `${label} must be a valid number`;
  return null;
}

export function validateSellingPrice(selling: string, purchase: string): string | null {
  const sell = Number(selling);
  const buy = Number(purchase || 0);
  if (Number.isNaN(sell) || sell <= 0) return "Selling price must be greater than 0";
  if (sell < buy) return "Selling price should not be less than purchase price";
  return null;
}
