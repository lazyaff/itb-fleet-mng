"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/Language";

type SelectProps<T> = {
  label?: string;
  data: T[];
  value: any;
  onChange: (val: any, item: T) => void;
  displayValue?: (item: T) => string;
  searchKeys?: (keyof T)[];
  required?: boolean;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
};

type DatePickerProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export function Select<T>({
  label,
  data,
  value,
  onChange,
  displayValue,
  searchKeys = [],
  required = false,
  placeholder = "Select",
  searchable = true,
  multiple = false,
}: SelectProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = data.filter((item: any) => {
    if (!search) return true;

    return searchKeys.some((key) =>
      String(item[key] || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  });

  const selected: any = !multiple
    ? data.find((item: any) => item.id?.toString() === value?.toString())
    : null;

  const truncate = (text: string, max = 32) => {
    if (text.length <= max) return text;
    return text.slice(0, max) + "...";
  };

  const renderLabel = (item: T) => {
    let text = "";

    if (displayValue) {
      text = displayValue(item);
    } else {
      text = Object.values(item as any)
        .filter((v) => typeof v === "string")
        .join(" - ");
    }

    return truncate(text);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={ref}>
      {label && (
        <label className="block mb-1 text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-700 cursor-pointer flex justify-between items-center select-none"
      >
        <span className="flex flex-wrap gap-1 mx-auto">
          <span>{placeholder}</span>
        </span>

        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-md">
          {searchable && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder={t("common.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md outline-none"
              />
            </div>
          )}

          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-3 text-gray-400 text-center text-sm">
                {t("common.no_data_found")}
              </div>
            )}

            {filtered.map((item: any, idx) => {
              const isSelected = multiple
                ? value?.includes(item.id)
                : selected?.id === item.id;

              return (
                <div
                  key={item.id ?? idx}
                  onClick={() => {
                    if (multiple) {
                      let newValue = Array.isArray(value) ? [...value] : [];

                      if (newValue.includes(item.id)) {
                        newValue = newValue.filter((v) => v !== item.id);
                      } else {
                        newValue.push(item.id);
                      }

                      onChange(newValue, item);
                    } else {
                      onChange(item.id, item);
                      setOpen(false);
                    }

                    setSearch("");
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    isSelected ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  {renderLabel(item)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Date",
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    inputRef.current?.showPicker?.(); // modern browser
    inputRef.current?.focus(); // fallback
  };

  return (
    <div
      onClick={handleOpen}
      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-700 cursor-pointer flex justify-between items-center"
    >
      <span className="mx-auto">{placeholder}</span>

      <Calendar className="w-4 h-4 text-gray-500" />

      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute opacity-0 pointer-events-none"
      />
    </div>
  );
}
