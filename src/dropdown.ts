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

export const inspectionConclusion = {
  "Siap Jalan": {
    color: "green",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-400",
    dot: "bg-green-500",
  },
  "Butuh Servis": {
    color: "yellow",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-400",
    dot: "bg-yellow-500",
  },
  "Dilarang Jalan": {
    color: "red",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-400",
    dot: "bg-red-500",
  },
} as const;

export const inspectionConclusionForm = [
  {
    title: "Siap Jalan",
    subtitle: "Siap digunakan segera",
    value: "Siap Jalan",
  },
  {
    title: "Butuh Servis",
    subtitle: "Jadwalkan servis setelah kembali",
    value: "Butuh Servis",
  },
  {
    title: "Dilarang Jalan",
    subtitle: "Perbaiki masalah 'Medium' sebelum disewakan",
    value: "Dilarang Jalan",
  },
];
