import { addMinutes, format, isBefore, parseISO, set } from "date-fns";

const DEFAULT_TIME = "00:00";

export const toUtcIso = (localDate: Date, time: string = DEFAULT_TIME): string => {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number.isNaN(Number(hoursRaw)) ? 0 : Number(hoursRaw);
  const minutes = Number.isNaN(Number(minutesRaw)) ? 0 : Number(minutesRaw);

  const localDateTime = set(localDate, {
    hours: Math.min(Math.max(hours, 0), 23),
    minutes: Math.min(Math.max(minutes, 0), 59),
    seconds: 0,
    milliseconds: 0,
  });

  return localDateTime.toISOString();
};

export const fromUtcIso = (iso: string): Date => parseISO(iso);

export const formatUtcIsoTime = (iso: string): string => format(parseISO(iso), "HH:mm");

export const isPastUtcIso = (iso: string): boolean =>
  isBefore(parseISO(iso), addMinutes(new Date(), -1));

export const startOfLocalDayUtcRange = (date: Date): { from: string; to: string } => {
  const from = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  const to = set(date, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};
