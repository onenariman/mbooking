export function formatPhone(digits: string) {
  const clean = digits.replace(/\D/g, "").slice(0, 10);

  let result = "+7";

  if (clean.length > 0) result += " (" + clean.slice(0, 3);
  if (clean.length >= 4) result += ") " + clean.slice(3, 6);
  if (clean.length >= 7) result += "-" + clean.slice(6, 8);
  if (clean.length >= 9) result += "-" + clean.slice(8, 10);

  return {
    formatted: result,
    raw: clean,
  };
}
