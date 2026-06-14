"use client";

import { Select } from "@/components/Dropdown";
import { useLanguage } from "@/context/Language";
import { bbm_payment_method } from "@/src/dropdown";
import { ImagePlus, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { FuelLog } from "./FuelLogTab";

export type FuelLogFormData = {
  date: string;
  cost: string;
  liters: string;
  payment_method: string;
  receipt: File | string | null;
  notes: string;
};

const emptyForm: FuelLogFormData = {
  date: "",
  cost: "",
  liters: "",
  payment_method: "",
  receipt: null,
  notes: "",
};

export default function FuelLogFormModal({
  open,
  mode,
  vehicleId,
  session,
  initialData,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "add" | "edit";
  vehicleId: string;
  session: any;
  initialData?: FuelLog | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<FuelLogFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialData) {
      setForm({
        date: initialData.date,
        cost: initialData.cost.toString(),
        liters: initialData.liters.toString(),
        payment_method: initialData.payment_method,
        receipt: initialData.receipt,
        notes: initialData.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
    setTouched(false);
  }, [open, mode, initialData]);

  const isValid =
    !!form.date &&
    Number(form.cost) > 0 &&
    Number(form.liters) > 0 &&
    !!form.payment_method &&
    !!form.receipt;

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("date", form.date);
      formData.append("cost", form.cost);
      formData.append("liters", form.liters);
      formData.append("payment_method", form.payment_method);
      formData.append("notes", form.notes || "");

      if (form.receipt instanceof File) {
        formData.append("receipt", form.receipt);
      }

      let response;
      if (mode === "add") {
        formData.append("vehicle_id", vehicleId);
        response = await fetch(`/api/v1/vehicle/fuel-log`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: formData,
        });
      } else {
        formData.append("id", initialData!.id);
        response = await fetch(`/api/v1/vehicle/fuel-log`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: formData,
        });
      }

      const result = await response.json();
      if (result.success) {
        await onSaved();
        onClose();
      }
    } catch (error) {
      console.log("Error saving fuel log:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`z-9998 fixed inset-0 flex justify-center items-start bg-gray-100 transition-opacity duration-500 px-6 py-8 overflow-y-auto ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col gap-6 overflow-y-auto">
        <div className="bg-white shadow-lg rounded-xl min-w-xl max-w-2xl">
          <div className="bg-[#F8FAFC] px-6 py-6 border-b border-gray-200 rounded-t-xl">
            <div className="font-semibold flex gap-2 items-center mb-2 text-base">
              <Info size={18} color="#00A1FE" />
              {mode === "add"
                ? t("vehicle_detail.bbm.modal.title")
                : t("vehicle_detail.bbm.modal.title_edit")}
            </div>
            <p className="text-[#64748B]">
              {t("vehicle_detail.bbm.modal.subtitle")}
            </p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                const file = e.dataTransfer.files?.[0];

                if (file) {
                  setForm((prev) => ({ ...prev, receipt: file }));
                }
              }}
              className="relative w-full min-h-60 bg-[#F8FAFC] border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden"
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                id="fuel-log-receipt-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setForm((prev) => ({ ...prev, receipt: file }));
                  }
                }}
              />

              <label
                htmlFor="fuel-log-receipt-upload"
                className="flex flex-col items-center justify-center w-full h-full min-h-60 cursor-pointer"
              >
                {form.receipt ? (
                  <div className="relative w-full h-60">
                    <img
                      src={
                        typeof form.receipt === "string"
                          ? form.receipt
                          : URL.createObjectURL(form.receipt)
                      }
                      alt="Receipt Preview"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-all flex items-center justify-center">
                      <span className="text-white font-medium">
                        Change Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-5">
                      <ImagePlus className="text-[#7B7B7B]" size={28} />
                    </div>

                    <h2 className="text-base font-semibold text-gray-800">
                      {t("vehicle_detail.bbm.modal.image.label")}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      {t("vehicle_detail.service.modal.image.placeholder")}
                    </p>
                  </>
                )}
              </label>
            </div>
            {touched && !form.receipt && (
              <p className="text-red-500 text-sm -mt-4">
                {t("form_builder.field_required")}
              </p>
            )}

            <div className="flex flex-row justify-between gap-6">
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_detail.bbm.modal.date.label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="date"
                  value={form.date}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
                {touched && !form.date && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("form_builder.field_required")}
                  </p>
                )}
              </div>
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_detail.bbm.modal.payment_method.label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  data={bbm_payment_method}
                  value={form.payment_method}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, payment_method: val }))
                  }
                  displayValue={(item) => item.label}
                  searchable={false}
                />
                {touched && !form.payment_method && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("form_builder.field_required")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-row justify-between gap-6">
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_detail.bbm.modal.cost.label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  value={form.cost}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cost: e.target.value }))
                  }
                />
                {touched && Number(form.cost) <= 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("form_builder.field_required")}
                  </p>
                )}
              </div>
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_detail.bbm.modal.liters.label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  step="0.01"
                  value={form.liters}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, liters: e.target.value }))
                  }
                />
                {touched && Number(form.liters) <= 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("form_builder.field_required")}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full">
              <label className="block mb-2">
                {t("vehicle_detail.bbm.modal.notes.label")}
              </label>
              <textarea
                autoComplete="off"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={t("vehicle_detail.bbm.modal.notes.placeholder")}
                rows={3}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-end gap-4">
          <button
            onClick={onClose}
            className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
              submitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#048ad8] cursor-pointer"
            }`}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
