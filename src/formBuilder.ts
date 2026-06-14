import { inspectionConclusion } from "./dropdown";

export type FormFieldType = "PG" | "TEXT" | "SECTION";

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  choices?: string[];
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export function groupFieldsIntoSections(fields: FormField[]): FormSection[] {
  const sections: FormSection[] = [];
  let current: FormSection | null = null;

  for (const field of fields) {
    if (field.type === "SECTION") {
      current = { title: field.name, fields: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { title: "", fields: [] };
      sections.push(current);
    }

    current.fields.push(field);
  }

  return sections;
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
