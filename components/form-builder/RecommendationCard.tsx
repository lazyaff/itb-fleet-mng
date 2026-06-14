"use client";

import { useLanguage } from "@/context/Language";
import { RECOMMENDATION_OPTIONS } from "@/src/formBuilder";

export default function RecommendationCard() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-[#00A1FE] bg-blue-50 px-2 py-1 rounded">
          {t("form_builder.recommendation_type_label")}
        </span>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {t("form_builder.recommendation_badge")}
        </span>
      </div>

      <h4 className="font-semibold mb-3">
        {t("form_builder.recommendation_title")}
      </h4>

      <div className="space-y-2">
        {RECOMMENDATION_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={`w-full px-4 py-2 rounded-lg border ${option.border} ${option.bg} ${option.text} font-medium text-center`}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
