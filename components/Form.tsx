"use client";

import { Check, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SelectProps<T> = {
  label?: string;
  data: T[];
  value: any;
  onChange: (val: any, item: T) => void;
  displayValue?: (item: T) => string;
  searchKeys?: (keyof T)[];
  required?: boolean;
};

type MultiSelectProps<T> = {
  label?: string;
  data: T[];
  value: any[]; // sekarang array
  onChange: (val: any[]) => void;
  displayValue?: (item: T) => string;
  searchKeys?: (keyof T)[];
  heigh?: number;
  required?: boolean;
};

type PasswordProps = {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
  name?: string;
};

export function Select<T>({
  label,
  data,
  value,
  onChange,
  displayValue,
  searchKeys = [],
  required = false,
}: SelectProps<T>) {
  const ref = useRef<HTMLDivElement>(null);

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

  const selected: any = data.find(
    (item: any) => item.id?.toString() === value?.toString(),
  );

  const truncate = (text: string, max = 10) => {
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

    return truncate(text, 32);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full relative" ref={ref}>
      {label && (
        <label className="block mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onClick={() => setOpen(!open)}
        className="w-full pl-4 pr-2 py-[0.275rem] border border-[#CBD5E1] rounded-lg text-[#64748B] cursor-pointer flex justify-between items-center select-none"
      >
        <span>{selected ? renderLabel(selected) : "-- Select --"}</span>

        <span className={`${open ? "rotate-180" : ""} transform duration-300`}>
          <ChevronDown />
        </span>
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-[#CBD5E1] rounded-lg shadow-lg">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-[#CBD5E1] outline-none"
          />

          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-3 text-gray-400 text-center">No data found</div>
            )}

            {filtered.map((item: any, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  onChange(item.id, item);
                  setOpen(false);
                  setSearch("");
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${idx === filtered.length - 1 ? "rounded-b-lg" : ""} ${
                  selected?.id === item.id ? "bg-blue-50" : "bg-white"
                }`}
              >
                {renderLabel(item)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MultiSelect<T>({
  label,
  data,
  value = [],
  onChange,
  displayValue,
  searchKeys = [],
  heigh = 24,
  required = false,
}: MultiSelectProps<T>) {
  const ref = useRef<HTMLDivElement>(null);

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

  const isSelected = (id: any) =>
    value.some((v) => v?.toString() === id?.toString());

  const toggleSelect = (item: any) => {
    if (isSelected(item.id)) {
      onChange(value.filter((v) => v.toString() !== item.id.toString()));
    } else {
      onChange([...value, item.id]);
    }
  };

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

  const selectedItems = data.filter((item: any) =>
    value.some((v) => v?.toString() === item.id?.toString()),
  );

  const renderSelectedText = () => {
    if (selectedItems.length === 0) return "-- Select --";
    if (selectedItems.length === 1) return renderLabel(selectedItems[0]);

    return `${selectedItems.length} selected`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={ref}>
      {label && (
        <label className="block mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onClick={() => setOpen(!open)}
        className="w-full pl-4 pr-2 py-[0.275rem] border border-[#CBD5E1] rounded-lg text-[#64748B] cursor-pointer flex justify-between items-center select-none"
      >
        <span>{renderSelectedText()}</span>

        <span className={`${open ? "rotate-180" : ""} transform duration-300`}>
          <ChevronDown />
        </span>
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-[#CBD5E1] rounded-lg shadow-lg">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-[#CBD5E1] outline-none"
          />

          <div className={`max-h-${heigh} overflow-y-auto`}>
            {filtered.length === 0 && (
              <div className="p-3 text-gray-400 text-center">No data found</div>
            )}

            {filtered.map((item: any, idx) => {
              const selected = isSelected(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item)}
                  className={`px-4 py-2 text-sm cursor-pointer flex justify-between items-center hover:bg-blue-50 ${idx === filtered.length - 1 ? "rounded-b-lg" : ""} ${
                    selected ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <span>{renderLabel(item)}</span>

                  {selected && <Check size={16} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  name,
}: PasswordProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          name={name}
          autoComplete="off"
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 pr-10 border border-gray-300 rounded-lg outline-none"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
