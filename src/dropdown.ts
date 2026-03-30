export const vehicle_status = [
  {
    name: "In Use",
  },
  {
    name: "Under Maintenance",
  },
  {
    name: "Available",
  },
];

export const vehicle_health = [
  {
    label: "Healthy",
    min: 50,
    max: 100,
  },
  {
    label: "Near Service",
    min: 25,
    max: 49,
  },
  {
    label: "Overdue",
    min: 0,
    max: 24,
  },
];

export const inspectionConclusion = [
  {
    label: "Siap Jalan",
    color: "green",
  },
  {
    label: "Butuh Servis",
    color: "yellow",
  },
  {
    label: "Dilarang Jalan",
    color: "red",
  },
];
