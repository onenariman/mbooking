export function formatPriceInput(value: string): string {
  return (
    value
      // Оставляем только цифры и точку
      .replace(/[^0-9.]/g, "")
      // Если точек несколько — оставляем только первую
      .replace(/(\..*?)\..*/g, "$1")
      // Убираем ведущие нули, кроме случаев с "0." для дробей
      .replace(/^0+([1-9])/g, "$1")
  );
}
