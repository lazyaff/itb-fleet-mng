export const vehicle_status = [
  {
    en: "In Use",
    id: "Sedang Digunakan",
  },
  {
    en: "Under Maintenance",
    id: "Dalam Perbaikan",
  },
  {
    en: "Available",
    id: "Tersedia",
  },
];

export const vehicle_status_color = {
  "In Use": {
    color: "green",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-400",
    dot: "bg-green-500",
  },
  "Under Maintenance": {
    color: "yellow",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-400",
    dot: "bg-yellow-500",
  },
  Available: {
    color: "blue",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-400",
    dot: "bg-blue-500",
  },
} as const;

export const vehicle_health = [
  {
    label: "Healthy",
    id: "Sehat",
    en: "Healthy",
    min: 50,
    max: 100,
  },
  {
    label: "Near Service",
    id: "Mendekati servis",
    en: "Near Service",
    min: 25,
    max: 49,
  },
  {
    label: "Overdue",
    id: "Terlambat",
    en: "Overdue",
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

export const usage_reconciliation_source = ["GPS", "MANUAL", "INITIAL"];

export const usage_reconciliation_source_color = {
  INITIAL: {
    color: "green",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-400",
    dot: "bg-green-500",
  },
  MANUAL: {
    color: "yellow",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-400",
    dot: "bg-yellow-500",
  },
  GPS: {
    color: "blue",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-400",
    dot: "bg-blue-500",
  },
} as const;

export const vehicle_gps_status_color = {
  Moving: {
    color: "green",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-400",
    dot: "bg-green-500",
  },
  Stopped: {
    color: "gray",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-400",
    dot: "bg-gray-500",
  },
  "No GPS": {
    color: "red",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-400",
    dot: "bg-red-500",
  },
} as const;
