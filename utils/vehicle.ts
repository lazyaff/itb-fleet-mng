import { DateTime } from "luxon";

export const healthDistanceCount = ({
  current_mileage,
  distance_limit,
}: {
  current_mileage: number;
  distance_limit: number;
}) => {
  const distance = 100 - (current_mileage / (distance_limit * 1000)) * 100;
  return Math.floor(Math.min(Math.max(distance, 0), 100));
};

export const healthTimeCount = ({
  last_service,
  time_limit,
}: {
  last_service: Date;
  time_limit: number;
}) => {
  const lastService = DateTime.fromJSDate(last_service);
  const now = DateTime.now();
  const diffDays = Math.max(Math.floor(now.diff(lastService, "days").days), 0);
  const time = 100 - (diffDays / (time_limit * 30)) * 100;
  return Math.floor(Math.min(Math.max(time, 0), 100));
};

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
  const distanceRate = healthDistanceCount({
    current_mileage,
    distance_limit,
  });

  const timeRate = healthTimeCount({
    last_service,
    time_limit,
  });

  return Math.min(distanceRate, timeRate);
};

export const getHealthStatus = (
  health: number,
): "healthy" | "near_service" | "overdue" => {
  if (health > 50) return "healthy";
  if (health >= 25) return "near_service";
  return "overdue";
};
