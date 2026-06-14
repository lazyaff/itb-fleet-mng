"use client";

import DeleteConfirmBanner from "@/components/form-builder/DeleteConfirmBanner";
import { useLanguage } from "@/context/Language";
import { FormField } from "@/src/formBuilder";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

type SectionFieldCardProps = {
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

export default function SectionFieldCard({
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
}: SectionFieldCardProps) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-900 rounded-xl shadow-md border p-6 ${
        error ? "border-red-400" : "border-gray-900"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {deleteConfirm ? (
        <DeleteConfirmBanner
          fieldName={field.name || t("form_builder.untitled_section")}
          onDelete={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      ) : (
        <div className="flex items-start gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-200 mt-2 touch-none"
            aria-label={t("form_builder.drag_handle")}
          >
            <GripVertical size={18} />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-semibold text-white bg-gray-700 px-2 py-1 rounded">
                {t("form_builder.section_type_label")}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={onMoveUp}
                  className={`p-1 rounded ${
                    isFirst
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-300 hover:text-blue-400 cursor-pointer"
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
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-300 hover:text-blue-400 cursor-pointer"
                  }`}
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={onRequestDelete}
                  className="p-1 rounded text-gray-300 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <input
              type="text"
              autoComplete="off"
              value={field.name}
              placeholder={t("form_builder.section_name_placeholder")}
              onChange={(e) => onChange({ ...field, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-600 bg-gray-800 text-white placeholder-gray-400 rounded-lg outline-none"
            />

            {error && (
              <p className="text-red-400 mt-2">
                {t("form_builder.field_required")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
