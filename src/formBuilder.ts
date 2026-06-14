import { inspectionConclusion } from "./dropdown";

export type FormFieldType = "PG" | "TEXT";

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  choices?: string[];
}

export const RECOMMENDATION_OPTIONS = [
  {
    label: "Ready to Drive",
    value: "Siap Jalan",
    ...inspectionConclusion["Siap Jalan"],
  },
  {
    label: "Service Required",
    value: "Butuh Servis",
    ...inspectionConclusion["Butuh Servis"],
  },
  {
    label: "Do Not Drive",
    value: "Dilarang Jalan",
    ...inspectionConclusion["Dilarang Jalan"],
  },
];

export function validateFormFields(
  fields: FormField[],
): Record<string, boolean> {
  const errors: Record<string, boolean> = {};

  for (const field of fields) {
    if (!field.name.trim()) {
      errors[field.id] = true;
      continue;
    }

    if (field.type === "PG") {
      const choices = field.choices || [];
      if (choices.length !== 4 || choices.some((choice) => !choice.trim())) {
        errors[field.id] = true;
      }
    }
  }

  return errors;
}
