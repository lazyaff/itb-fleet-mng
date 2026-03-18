import { DateTime } from "luxon";

export const healthCount = ({
  current_mileage,
  distance_limit,
  last_service,
  time_limit,
}: {
  current_mileage: number;
  distance_limit: number;
  last_service: Date;
  time_limit: number;
}) => {
  const distance = 100 - (current_mileage / (distance_limit * 1000)) * 100;
  const distanceRate = Math.min(Math.max(distance, 0), 100);

  const lastService = DateTime.fromJSDate(last_service);
  const now = DateTime.now();
  const diffDays = now.diff(lastService, "days").days;
  const time = 100 - (diffDays / time_limit) * 100;
  const timeRate = Math.floor(Math.min(Math.max(time, 0), 100));

  // console.log("Distance", distance, distanceRate, "Time", time, timeRate);

  return Math.min(distanceRate, timeRate);
};
