"use client";

import { Input } from "../ui/input";
import { formatPhone } from "./formatPhone";

const InputPhone = ({
  value, // ← ТОЛЬКО цифры
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
  label?: React.ReactNode;
}) => {
  const { formatted } = formatPhone(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");

    // убираем возможную 7 или 8 в начале
    const normalized =
      digits.startsWith("7") || digits.startsWith("8")
        ? digits.slice(1)
        : digits;

    onChange(normalized.slice(0, 10));
  };

  return (
    <div className="flex flex-col gap-y-2">
      <Input
        value={formatted}
        inputMode="numeric"
        onChange={handleChange}
        placeholder="+7 (___) ___-__-__"
        suppressHydrationWarning
      />

      {value.length > 0 &&
        (value.length < 10 ? (
          <p className="text-red-500">Не хватает цифр</p>
        ) : (
          <p className="text-green-500">Все верно</p>
        ))}
    </div>
  );
};

export default InputPhone;
