"use client";

import { useLanguage } from "@/context/Language";
import { FormField, RECOMMENDATION_OPTIONS } from "@/src/formBuilder";

type FormFieldsViewProps = {
  fields: FormField[];
  mode?: "preview" | "interactive";
  answers?: Record<string, string>;
  onAnswerChange?: (fieldId: string, value: string) => void;
  conclusion?: string;
  onConclusionChange?: (value: string) => void;
};

export default function FormFieldsView({
  fields,
  mode = "preview",
  answers = {},
  onAnswerChange,
  conclusion,
  onConclusionChange,
}: FormFieldsViewProps) {
  const { t } = useLanguage();
  const interactive = mode === "interactive";

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div
          key={field.id}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <h4 className="font-semibold mb-3">
            {field.name || t("form_builder.untitled_field")}
          </h4>

          {field.type === "PG" ? (
            <div className="space-y-2">
              {(field.choices ?? []).map((choice, choiceIndex) => (
                <label
                  key={choiceIndex}
                  onClick={() =>
                    interactive && onAnswerChange?.(field.id, choice)
                  }
                  className={`flex gap-2 items-start ${
                    interactive ? "cursor-pointer" : ""
                  }`}
                >
                  <input
                    type="radio"
                    checked={answers[field.id] === choice}
                    readOnly
                    disabled={!interactive}
                    className="mt-1"
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              disabled={!interactive}
              placeholder={t("form_builder.text_placeholder")}
              value={interactive ? answers[field.id] ?? "" : ""}
              onChange={(e) =>
                interactive && onAnswerChange?.(field.id, e.target.value)
              }
              className={`w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none ${
                !interactive ? "bg-gray-50 text-gray-400" : ""
              }`}
            />
          )}
        </div>
      ))}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h4 className="font-semibold mb-3">
          {t("form_builder.recommendation_title")}
        </h4>

        <div className="space-y-2">
          {RECOMMENDATION_OPTIONS.map((option) => (
            <label
              key={option.value}
              onClick={() =>
                interactive && onConclusionChange?.(option.value)
              }
              className={`flex w-full px-4 py-2 rounded-lg border items-center gap-2 ${option.border} ${option.bg} ${option.text} font-medium ${
                interactive ? "cursor-pointer" : ""
              }`}
            >
              <input
                type="radio"
                checked={conclusion === option.value}
                readOnly
                disabled={!interactive}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
