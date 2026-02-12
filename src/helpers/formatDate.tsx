import { format as dfFormat } from "date-fns";
import { ru } from "date-fns/locale";

export const formatDate = (date: Date, formatStr: string = "PPP") => {
  return dfFormat(date, formatStr, { locale: ru });
};
