"use client";

import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";

const Sidebar = () => {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { pageInfo } = useContext(PageInfoContext);
  const [pendingRequest, setPendingRequest] = useState({
    my_request: 0,
    all_request: 0,
  });
  const role = session?.user?.role_id;

  const { t } = useLanguage();
  const router = useRouter();

  const [openMenus, setOpenMenus] = useState<string[]>([
    "admin",
    "maintenance",
    "live_fleet_map",
    "reports",
  ]);

  const pageData = [
    {
      id: "dashboard",
      title: t("sidebar.dashboard_overview"),
      url: "/admin/dashboard",
      icon: <LayoutDashboard size={18} />,
      item: [],
      allowedRoles: ["SADM", "ADM", "UOPS"],
    },
    {
      id: "live_fleet_map",
      title: t("sidebar.live_fleet_map"),
      allowedRoles: ["SADM", "ADM", "UOPS"],
      item: [
        {
          id: "real_time_map",
          title: t("sidebar.real_time_map"),
          url: "/admin/live-track",
          allowedRoles: ["SADM", "ADM", "UOPS"],
        },
      ],
    },
    {
      id: "maintenance",
      title: t("sidebar.maintenance"),
      allowedRoles: ["SADM", "ADM", "UOPS"],
      item: [
        {
          id: "vehicle_list",
          title: t("sidebar.vehicle_list"),
          url: "/admin/vehicle",
          allowedRoles: ["SADM", "ADM", "UOPS"],
        },
        {
          id: "inspection",
          title: t("sidebar.inspection"),
          url: "/admin/inspection",
          allowedRoles: ["SADM", "ADM", "UOPS"],
        },
        {
          id: "vehicle_sync",
          title: t("sidebar.vehicle_sync"),
          url: "/admin/vehicle-sync",
          allowedRoles: ["SADM", "ADM", "UOPS"],
        },
      ],
    },
    {
      id: "reports",
      title: t("sidebar.reports"),
      allowedRoles: ["SADM", "ADM", "UOPS"],
      item: [
        {
          id: "monthly_report",
          title: t("sidebar.monthly_report"),
          url: "/admin/reports/monthly-recap",
          allowedRoles: ["SADM", "ADM", "UOPS"],
        },
        {
          id: "my_request",
          title: t("sidebar.my_request"),
          url: "/admin/my-request",
          allowedRoles: ["SADM", "ADM", "UOPS"],
          counter: pendingRequest.my_request,
        },
      ],
    },
    {
      id: "admin",
      title: t("sidebar.admin"),
      allowedRoles: ["SADM", "ADM"],
      item: [
        {
          id: "vehicle_parts",
          title: t("sidebar.vehicle_parts"),
          url: "/admin/vehicle-part",
          allowedRoles: ["SADM", "ADM"],
        },
        {
          id: "gps_tracker",
          title: t("sidebar.gps_tracker"),
          url: "/admin/gps-tracker",
          allowedRoles: ["SADM", "ADM"],
        },
        {
          id: "approval_inbox",
          title: t("sidebar.approval_inbox"),
          url: "/admin/approval-inbox",
          allowedRoles: ["SADM", "ADM"],
          counter: pendingRequest.all_request,
        },
        {
          id: "form_builder",
          title: t("sidebar.form_builder"),
          url: "/admin/form-builder",
          allowedRoles: ["SADM", "ADM"],
        },
        {
          id: "user_management",
          title: t("sidebar.user_management"),
          url: "/admin/user-management",
          allowedRoles: ["SADM"],
        },
      ],
    },
  ];

  const filteredPageData = useMemo(() => {
    return pageData
      .filter((menu) => menu.allowedRoles.includes(role))
      .map((menu) => ({
        ...menu,
        item: menu.item.filter((sub) => sub.allowedRoles.includes(role)),
      }));
  }, [role, pageData]);

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

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v1/alert/request", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      const response = await res.json();
      setPendingRequest(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <div className="relative z-10 flex h-screen w-64 flex-col select-none bg-white shadow-[6px_0_15px_rgba(0,0,0,0.1)]">
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
        {filteredPageData.map((menu) => {
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
                <div className="flex items-center text-sm gap-3">
                  {menu.icon}
                  <span className={`${menu.icon ? "" : "tracking-[0.1rem]"}`}>
                    {menu.icon ? menu.title : menu.title.toUpperCase()}
                  </span>
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
                        className={`flex cursor-pointer items-start text-sm font-medium transition-colors
                                    ${active ? "text-blue-500" : "text-gray-700 hover:text-blue-500"}
                                  `}
                      >
                        <span className="mr-2">•</span>

                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span>{sub.title}</span>

                          {sub.counter != undefined && sub.counter > 0 && (
                            <span className="rounded-full bg-[#EF4444] text-white h-5 min-w-5 px-1 flex items-center justify-center font-semibold text-[0.65rem] leading-none pt-0.5">
                              {sub.counter}
                            </span>
                          )}
                        </span>
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
