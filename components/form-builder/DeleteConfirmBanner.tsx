"use client";

import { useLanguage } from "@/context/Language";

type DeleteConfirmBannerProps = {
  fieldName: string;
  onDelete: () => void;
  onCancel: () => void;
};

export default function DeleteConfirmBanner({
  fieldName,
  onDelete,
  onCancel,
}: DeleteConfirmBannerProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <p className="text-red-700 font-medium">
        {t("form_builder.delete_confirm_prefix")}
        {fieldName}
        {t("form_builder.delete_confirm_suffix")}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 bg-white text-black border border-gray-300 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer font-medium select-none"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-6 bg-[#EF4444] hover:bg-[#cc3b3b] text-white py-1.5 rounded-lg cursor-pointer font-medium select-none"
        >
          {t("form_builder.delete_button")}
        </button>
      </div>
    </div>
  );
}
