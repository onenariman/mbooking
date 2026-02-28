export function formatPriceInput(value: string): string {
  return value
    // Разрешаем только цифры и одну десятичную точку.
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*?)\..*/g, "$1")
    // Обрезаем ведущие нули в целой части.
    .replace(/^0+([1-9])/g, "$1");
}

