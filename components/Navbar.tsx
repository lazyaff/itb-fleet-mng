"use client";

import { ChevronDown, ChevronRight, LogOut, UserKey } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useContext } from "react";
import { LoadingContext } from "../context/Loading";
import { useRouter } from "next/navigation";
import { PageInfoContext } from "../context/PageInfo";

const Navbar = () => {
  const { data: session } = useSession();
  const { pageInfo } = useContext(PageInfoContext);
  const [open, setOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between items-center bg-white shadow px-4 h-16 select-none sticky top-0 z-60">
      <div className="flex items-center flex-row py-8 px-4 gap-3 text-sm">
        <span className="text-[#64748B]">
          {pageInfo.title === "Dashboard Overview" ? "Home" : pageInfo.title}
        </span>
        <span className="text-[#64748B]">
          <ChevronRight size={15} />
        </span>
        <span className="">{pageInfo.subtitle}</span>
      </div>
      <div className="flex items-center flex-row py-8 px-4">
        <div
          ref={dropdownRef}
          className="relative flex items-center gap-2 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <div className="bg-[#A2C3E3] rounded-lg w-9 h-9 flex items-center justify-center text-xl">
            {session?.user?.name?.[0]}
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-sm">{session?.user?.name}</span>
            <span className="text-sm">{session?.user?.email}</span>
          </div>

          <ChevronDown
            className={`ml-8 transition-transform ${open ? "rotate-180" : ""}`}
          />

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-14 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-70">
              <button
                onClick={() => {
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm flex flex-row gap-1.5 items-center cursor-pointer"
              >
                <UserKey size={16} /> <span>Change Password</span>
              </button>

              <button
                onClick={async () => {
                  setOpen(false);
                  setLoading(true);
                  await signOut({ redirect: false });
                  router.push("/");
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-red-500 flex flex-row gap-1.5 items-center cursor-pointer"
              >
                <LogOut size={16} className="rotate-180" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
