import { DateTime } from "luxon";

const formatedDate = (date: Date, format: string) => {
  return DateTime.fromISO(date.toISOString(), {
    zone: "Asia/Jakarta",
    locale: "id",
  }).toFormat(format);
};

const timeAgo = (date: string, locale: "id" | "en" = "en") => {
  const now = DateTime.now();
  const target = DateTime.fromISO(date, { zone: "utc" }).toLocal();

  const diffInSeconds = Math.floor(target.diff(now, "seconds").seconds);
  const diffInMinutes = Math.floor(target.diff(now, "minutes").minutes);
  const diffInHours = Math.floor(target.diff(now, "hours").hours);
  const diffInDays = Math.floor(target.diff(now, "days").days);
  const diffInMonths = Math.floor(target.diff(now, "months").months);
  const diffInYears = Math.floor(target.diff(now, "years").years);

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "narrow",
  });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, "second");
  }

  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, "minute");
  }

  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, "hour");
  }

  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, "day");
  }

  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, "month");
  }

  return rtf.format(diffInYears, "year");
};

export { formatedDate, timeAgo };
