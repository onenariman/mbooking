export function formatNameInput(value: string): string {
  return value
    // Оставляем только буквы (любой язык), пробел и дефис.
    .replace(/[^\p{L}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ");
}

