export const sanitizeDecimalInput = (
  value: string,
  maxDecimals = 4
): string | null => {
  // Allow empty
  if (value === "") return "";

  // Allow typing states
  if (value === "." || value === "0.") return value;

  // Only digits + optional dot
  if (!/^\d*\.?\d*$/.test(value)) return null;

  const [int, dec] = value.split(".");

  // Block more than maxDecimals
  if (dec && dec.length > maxDecimals) return null;

  return value;
};

export const normalizeToFixed = (value: string, maxDecimals = 4) => {
  const num = Number(value);
  if (isNaN(num)) return "0";
  return num.toFixed(maxDecimals);
};
