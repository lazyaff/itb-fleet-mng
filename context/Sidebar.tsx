"use client";

import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

const Sidebar = () => {
  const { setLoading } = useContext(LoadingContext);
  const { pageInfo } = useContext(PageInfoContext);
  const router = useRouter();

  const [openMenus, setOpenMenus] = useState<string[]>([
    "Admin",
    "Maintenance",
    "Live Fleet Map",
  ]);

  const pageData = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <LayoutDashboard className="mr-3" size={18} />,
      item: [],
    },
    {
      title: "Live Fleet Map",
      item: [{ title: "Real-Time Map", url: "/admin/live-track" }],
    },
    {
      title: "Maintenance",
      item: [
        { title: "Vehicle List", url: "/admin/vehicle" },
        { title: "Inspection", url: "/admin/inspection" },
      ],
    },
    {
      title: "Admin",
      item: [
        { title: "Vehicle Parts", url: "/admin/vehicle-part" },
        { title: "User Inspection", url: "/admin/inspector" },
        { title: "GPS Tracker", url: "/admin/gps-tracker" },
      ],
    },
  ];

  const handleNavigate = (url: string, title: string) => {
    console.log(pageInfo.title);
    if (pageInfo.title !== title) {
      setLoading(true);
      router.push(url);
    }
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(
      (prev) =>
        prev.includes(title)
          ? prev.filter((t) => t !== title) // tutup
          : [...prev, title], // buka tanpa nutup yang lain
    );
  };

  return (
    <div className="relative z-10 flex flex-col bg-[#F7F7F7] w-72 h-screen shadow-[6px_0_15px_rgba(0,0,0,0.1)] select-none">
      <div className="px-6 py-3 border-b border-slate-400 h-16">
        <div className="flex items-center gap-3 justify-center">
          <Image
            src="/image/logo-itb.png"
            alt="logo"
            width={40}
            height={40}
            className="rounded-full"
            draggable={false}
          />
          <span className="font-semibold text-gray-700 text-lg">
            E-Facility Fleet
          </span>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 py-4 space-y-4">
        {pageData.map((menu, index) => {
          const isDropdown = menu.item.length > 0;
          const isOpen = openMenus.includes(menu.title);

          return (
            <div key={index}>
              <div
                className={`flex items-center justify-between cursor-pointer px-2 py-2 rounded-md
                ${
                  pageInfo.title === menu.title
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 hover:text-blue-500"
                }`}
                onClick={() => {
                  if (isDropdown) {
                    toggleMenu(menu.title);
                  } else if (menu.url) {
                    handleNavigate(menu.url, menu.title);
                  }
                }}
              >
                <div className="flex items-center text-sm font-medium">
                  {menu.icon}
                  {menu.title}
                </div>

                {isDropdown && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>

              {isDropdown && isOpen && (
                <div className="ml-6 mt-2 space-y-4">
                  {menu.item.map((sub, i) => {
                    const active = pageInfo.subtitle === sub.title;
                    return (
                      <div
                        key={i}
                        onClick={() => handleNavigate(sub.url, sub.title)}
                        className={`flex items-center text-sm cursor-pointer transition-colors
                        ${
                          active
                            ? "text-blue-500 font-medium"
                            : "text-gray-700 hover:text-blue-500"
                        }`}
                      >
                        <span className="mr-2">•</span>
                        {sub.title}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
