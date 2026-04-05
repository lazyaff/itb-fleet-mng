"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Inspector() {
  const router = useRouter();
  return (
    <div>
      <button
        className="flex flex-row justify-center items-center bg-[#CCD7F9] text-[#2D4583] hover:bg-[#b4bcd8] py-2 rounded-lg text-center cursor-pointer transition-colors duration-200"
        onClick={async () => {
          await signOut({ redirect: false });
          router.push("/");
        }}
      >
        Keluar
      </button>
    </div>
  );
}
