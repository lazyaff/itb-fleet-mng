import { DateTime } from "luxon";

const formatedDate = (date: Date, format: string) => {
  return DateTime.fromISO(date.toISOString(), {
    zone: "Asia/Jakarta",
    locale: "id",
  }).toFormat(format);
};

export { formatedDate };
