"use client";

import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

const Sidebar = () => {
  const { setLoading } = useContext(LoadingContext);
  const { pageInfo } = useContext(PageInfoContext);

  const { t } = useLanguage();
  const router = useRouter();

  const [openMenus, setOpenMenus] = useState<string[]>([
    "admin",
    "maintenance",
    "live_fleet_map",
  ]);

  const pageData = [
    {
      id: "dashboard",
      title: t("sidebar.dashboard_overview"),
      url: "/admin/dashboard",
      icon: <LayoutDashboard size={18} />,
      item: [],
    },
    {
      id: "live_fleet_map",
      title: t("sidebar.live_fleet_map"),
      item: [
        {
          id: "real_time_map",
          title: t("sidebar.real_time_map"),
          url: "/admin/live-track",
        },
      ],
    },
    {
      id: "maintenance",
      title: t("sidebar.maintenance"),
      item: [
        {
          id: "vehicle_list",
          title: t("sidebar.vehicle_list"),
          url: "/admin/vehicle",
        },
        {
          id: "inspection",
          title: t("sidebar.inspection"),
          url: "/admin/inspection",
        },
      ],
    },
    {
      id: "admin",
      title: t("sidebar.admin"),
      item: [
        {
          id: "vehicle_parts",
          title: t("sidebar.vehicle_parts"),
          url: "/admin/vehicle-part",
        },
        // {
        //   id: "user_inspection",
        //   title: t("sidebar.user_inspection"),
        //   url: "/admin/inspector",
        // },
        {
          id: "gps_tracker",
          title: t("sidebar.gps_tracker"),
          url: "/admin/gps-tracker",
        },
      ],
    },
  ];

  const handleNavigate = (url: string, title: string) => {
    if (pageInfo.title !== title && pageInfo.subtitle !== title) {
      setLoading(true);
      router.push(url);
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="relative z-10 flex h-screen w-64 flex-col select-none bg-[#F7F7F7] shadow-[6px_0_15px_rgba(0,0,0,0.1)]">
      <div className="h-16 border-b border-slate-400 px-6 py-3">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/image/logo-itb.png"
            alt="logo"
            width={40}
            height={40}
            className="rounded-full"
            draggable={false}
          />

          <span className="text-lg font-semibold text-gray-700">
            E-Facility Fleet
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 px-4 py-4">
        {pageData.map((menu) => {
          const isDropdown = menu.item.length > 0;
          const isOpen = openMenus.includes(menu.id);

          return (
            <div key={menu.id}>
              <div
                onClick={() => {
                  if (isDropdown) {
                    toggleMenu(menu.id);
                    return;
                  }

                  if (menu.url) {
                    handleNavigate(menu.url, menu.title);
                  }
                }}
                className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-2
                  ${
                    pageInfo.title === menu.title
                      ? "font-medium text-blue-500"
                      : "text-gray-700 hover:text-blue-500"
                  }
                `}
              >
                <div className="flex items-center text-sm font-medium gap-3">
                  {menu.icon}
                  {menu.title}
                </div>

                {isDropdown && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      !isOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>

              {isDropdown && isOpen && (
                <div className="ml-6 mt-2 space-y-4">
                  {menu.item.map((sub) => {
                    const active = pageInfo.subtitle === sub.title;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleNavigate(sub.url, sub.title)}
                        className={`flex cursor-pointer items-center text-sm transition-colors
                          ${
                            active
                              ? "font-medium text-blue-500"
                              : "text-gray-700 hover:text-blue-500"
                          }
                        `}
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
