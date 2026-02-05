export function formatNameInput(value: string): string {
  return (
    value
      // Оставляем только буквы (ru/en) и пробелы
      .replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "")
      // Убираем повторяющиеся пробелы
      .replace(/\s+/g, " ")
      // Убираем пробел в начале
      .trimStart()
      // Делаем каждое слово с заглавной буквы
      .split(" ")
      .map((word) =>
        word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : "",
      )
      .join(" ")
  );
}
