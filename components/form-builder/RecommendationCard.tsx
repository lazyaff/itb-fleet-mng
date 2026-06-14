"use client";

import { useLanguage } from "@/context/Language";
import { RECOMMENDATION_OPTIONS } from "@/src/formBuilder";
import { Lock } from "lucide-react";

export default function RecommendationCard() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
          {t("form_builder.recommendation_type_label")}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
          <Lock size={14} />
          {t("form_builder.recommendation_badge")}
        </span>
      </div>

      <h4 className="font-semibold mb-3">
        {t("form_builder.recommendation_title")}
      </h4>

      <div className="grid grid-cols-3 gap-2">
        {RECOMMENDATION_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={`px-4 py-2 rounded-lg border ${option.border} ${option.bg} ${option.text} font-medium text-center`}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
}
