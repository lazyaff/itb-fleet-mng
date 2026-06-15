"use client";

import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { timeAgo } from "@/utils/date";
import { Bell, TriangleAlert } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

type Alert = {
  title: string;
  plate_number: string;
  health: number;
  date: string;
};

// Roles allowed to see the critical-alert bell (not inspectors).
const ALLOWED_ROLES = ["SADM", "ADM", "UOPS"];

const POLL_INTERVAL_MS = 60_000;

const AlertBell = () => {
  const { data: session } = useSession() as { data: any };
  const { t, lang } = useLanguage();
  const { setLoading } = useContext(LoadingContext);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role_id;
  const canView = ALLOWED_ROLES.includes(role ?? "");

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/v1/alert", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await res.json();
      if (result.success) {
        setAlerts(result.data.data);
      } else if (result.status === 401) {
        await signOut({ redirect: false });
        router.push("/");
      }
    } catch (error) {
      console.log("Error fetching alerts:", error);
    }
  };

  useEffect(() => {
    if (!session || !canView) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session, canView]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!canView) return null;

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer"
        aria-label={t("alert.notifications")}
      >
        <Bell size={20} className="text-gray-700" />
        {alerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg overflow-hidden z-70 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-sm">
              {t("alert.notifications")}
            </span>
            {alerts.length > 0 && (
              <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                <TriangleAlert size={13} /> {alerts.length}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto flex flex-col gap-2 p-3">
            {alerts.length > 0 ? (
              alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-3 border-[0.1px] border-[#EF4444]/20 bg-[#f8f8f9] rounded-lg flex flex-col gap-2"
                >
                  <span className="font-semibold text-red-500 text-sm">
                    {alert.title}
                  </span>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[0.65rem] text-[#64748B]">
                      {t("inspection.vehicle")}: {alert.plate_number}
                    </span>
                    <span className="text-[0.65rem] text-[#64748B]">
                      {timeAgo(alert.date, lang)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-[#64748B] text-sm">
                {t("alert.no_alerts")}
              </div>
            )}
          </div>

          {alerts.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                setLoading(true);
                router.push("/admin/vehicle");
              }}
              className="w-full text-center py-3 text-[#00A1FE] text-sm font-medium hover:bg-gray-50 cursor-pointer border-t border-gray-100"
            >
              {t("alert.view_all")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertBell;
