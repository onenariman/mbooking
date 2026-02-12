"use client";

import { useState } from "react";

interface FilterDateProps {
  onChange: (from: Date | null, to: Date | null) => void;
}

export function FilterDate({ onChange }: FilterDateProps) {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const handleApply = () => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    onChange(fromDate, toDate);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <label className="text-sm">С:</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      <div className="flex items-center gap-1">
        <label className="text-sm">По:</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      <button
        onClick={handleApply}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Показать
      </button>
    </div>
  );
}
