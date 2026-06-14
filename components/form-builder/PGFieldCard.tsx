"use client";

import DeleteConfirmBanner from "@/components/form-builder/DeleteConfirmBanner";
import { useLanguage } from "@/context/Language";
import { FormField } from "@/src/formBuilder";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

type PGFieldCardProps = {
  field: FormField;
  isFirst: boolean;
  isLast: boolean;
  error?: boolean;
  deleteConfirm: boolean;
  onChange: (field: FormField) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export default function PGFieldCard({
  field,
  isFirst,
  isLast,
  error,
  deleteConfirm,
  onChange,
  onMoveUp,
  onMoveDown,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: PGFieldCardProps) {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const choices = field.choices ?? ["", "", "", ""];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-md border p-6 ${
        error ? "border-red-400" : "border-gray-100"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {deleteConfirm ? (
        <DeleteConfirmBanner
          fieldName={field.name || t("form_builder.untitled_field")}
          onDelete={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      ) : (
        <div className="flex items-start gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 mt-2 touch-none"
            aria-label={t("form_builder.drag_handle")}
          >
            <GripVertical size={18} />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-[#00A1FE] bg-blue-50 px-2 py-1 rounded">
                {t("form_builder.pg_type_label")}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={onMoveUp}
                  className={`p-1 rounded ${
                    isFirst
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-500 cursor-pointer"
                  }`}
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={onMoveDown}
                  className={`p-1 rounded ${
                    isLast
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:text-blue-500 cursor-pointer"
                  }`}
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={onRequestDelete}
                  className="p-1 rounded text-gray-500 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <input
              type="text"
              autoComplete="off"
              value={field.name}
              placeholder={t("form_builder.field_name_placeholder")}
              onChange={(e) => onChange({ ...field, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none mb-3"
            />

            <label className="block mb-2 text-[#64748B]">
              {t("form_builder.choices_label")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {choices.map((choice, choiceIndex) => (
                <input
                  key={choiceIndex}
                  type="text"
                  autoComplete="off"
                  value={choice}
                  placeholder={`${t("form_builder.choice_placeholder")} ${choiceIndex + 1}`}
                  onChange={(e) => {
                    const updated = [...choices];
                    updated[choiceIndex] = e.target.value;
                    onChange({ ...field, choices: updated });
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 mt-2">
                {t("form_builder.field_required")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
