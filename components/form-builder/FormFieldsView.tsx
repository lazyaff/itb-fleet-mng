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
            <div
              className={
                interactive ? "space-y-2" : "grid grid-cols-2 gap-2"
              }
            >
              {(field.choices ?? []).map((choice, choiceIndex) => {
                const checked = answers[field.id] === choice;

                return (
                  <label
                    key={choiceIndex}
                    onClick={() =>
                      interactive && onAnswerChange?.(field.id, choice)
                    }
                    className={`flex gap-2 items-start px-3 py-1.5 border rounded-lg ${
                      checked
                        ? "border-[#00A1FE] bg-blue-50"
                        : "border-gray-300"
                    } ${interactive ? "cursor-pointer" : ""}`}
                  >
                    <input
                      type="radio"
                      checked={checked}
                      readOnly
                      disabled={!interactive}
                      className="mt-1 shrink-0"
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {choice}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              rows={3}
              maxLength={150}
              disabled={!interactive}
              placeholder={t("form_builder.text_placeholder")}
              value={interactive ? answers[field.id] ?? "" : ""}
              onChange={(e) =>
                interactive && onAnswerChange?.(field.id, e.target.value)
              }
              className={`w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none resize-none ${
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

        <div
          className={interactive ? "space-y-2" : "grid grid-cols-3 gap-2"}
        >
          {RECOMMENDATION_OPTIONS.map((option) =>
            interactive ? (
              <label
                key={option.value}
                onClick={() => onConclusionChange?.(option.value)}
                className={`flex items-start gap-2 px-4 py-2 rounded-lg border cursor-pointer font-medium ${option.border} ${option.bg} ${option.text}`}
              >
                <input
                  type="radio"
                  checked={conclusion === option.value}
                  readOnly
                  className="mt-1 shrink-0"
                />
                <span className="min-w-0 flex-1 break-words">
                  {option.label}
                </span>
              </label>
            ) : (
              <div
                key={option.value}
                className={`px-4 py-2 rounded-lg border text-center font-medium break-words ${option.border} ${option.bg} ${option.text}`}
              >
                {option.label}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
