"use client";

import { LoadingContext } from "@/context/Loading";
import { useContext } from "react";

export function Loading() {
  const { loading } = useContext(LoadingContext);

  return (
    loading && (
      <div className="z-999 fixed inset-0 flex justify-center items-center bg-black/75">
        <div className="border-4 border-white border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
      </div>
    )
  );
}
