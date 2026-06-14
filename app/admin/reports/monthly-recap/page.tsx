"use client";

import { DatePicker } from "@/components/Dropdown";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { monthly_recap_health } from "@/src/dropdown";
import { getHealthStatus } from "@/utils/vehicle";
import { Download } from "lucide-react";
import { DateTime } from "luxon";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";

type Vehicle = {
  id: string;
  plate_number: string;
  name: string;
  health: number;
  updated: boolean;
};

type RecapEntry = {
  vehicle_id: string;
  total_km: number;
  service_count: number;
  inspection_count: number;
  fuel_count: number;
  fuel_liters: number;
  fuel_cost: number;
};

export default function MonthlyRecapPage() {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recap, setRecap] = useState<RecapEntry[]>([]);

  const defaultRange = {
    from: DateTime.now().startOf("month").toISODate() as string,
    to: DateTime.now().toISODate() as string,
  };
  const [draftRange, setDraftRange] = useState(defaultRange);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.reports"),
      subtitle: t("sidebar.monthly_report"),
    });
  }, [lang]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`/api/v1/vehicle`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) {
        setVehicles(result.data.vehicle);
      } else if (result.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.log("Error fetching vehicle data:", error);
    }
  };

  const fetchRecap = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/report/monthly-recap?from=${appliedRange.from}&to=${appliedRange.to}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (result.success) {
        setRecap(result.data.recap);
      } else if (result.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.log("Error fetching monthly recap data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchVehicles();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchRecap();
    }
  }, [session, appliedRange]);

  const daysInRange = useMemo(() => {
    const from = DateTime.fromISO(appliedRange.from);
    const to = DateTime.fromISO(appliedRange.to);
    return Math.max(Math.floor(to.diff(from, "days").days) + 1, 1);
  }, [appliedRange]);

  const rows = useMemo(() => {
    return vehicles
      .filter((vehicle) => vehicle.updated)
      .map((vehicle) => {
        const entry = recap.find((r) => r.vehicle_id === vehicle.id);
        const total_km = entry?.total_km ?? 0;

        return {
          id: vehicle.id,
          plate_number: vehicle.plate_number,
          name: vehicle.name,
          health: vehicle.health,
          total_km,
          avg_km_per_day: total_km / daysInRange,
          service_count: entry?.service_count ?? 0,
          inspection_count: entry?.inspection_count ?? 0,
          fuel_count: entry?.fuel_count ?? 0,
          fuel_liters: entry?.fuel_liters ?? 0,
          fuel_cost: entry?.fuel_cost ?? 0,
        };
      });
  }, [vehicles, recap, daysInRange]);

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          total_km: acc.total_km + row.total_km,
          total_liters: acc.total_liters + row.fuel_liters,
          total_cost: acc.total_cost + row.fuel_cost,
          total_service: acc.total_service + row.service_count,
        }),
        { total_km: 0, total_liters: 0, total_cost: 0, total_service: 0 },
      ),
    [rows],
  );

  const formatNumber = (value: number, maximumFractionDigits = 0) =>
    value.toLocaleString("id-ID", { maximumFractionDigits });

  const formatRupiah = (value: number) => `Rp ${formatNumber(value)}`;

  const handleExportCsv = () => {
    const headers = [
      t("monthly_recap.table.vehicle"),
      t("monthly_recap.table.health"),
      t("monthly_recap.table.total_km"),
      t("monthly_recap.table.avg_km_per_day"),
      t("monthly_recap.table.service"),
      t("monthly_recap.table.inspection"),
      t("monthly_recap.table.fuel_count"),
      t("monthly_recap.table.liter"),
      t("monthly_recap.table.cost"),
    ];

    const csvRows = rows.map((row) => {
      const healthConfig = monthly_recap_health[getHealthStatus(row.health)];
      return [
        `${row.plate_number} - ${row.name}`,
        healthConfig[lang],
        formatNumber(row.total_km),
        formatNumber(row.avg_km_per_day, 1),
        formatNumber(row.service_count),
        formatNumber(row.inspection_count),
        formatNumber(row.fuel_count),
        formatNumber(row.fuel_liters, 2),
        formatRupiah(row.fuel_cost),
      ];
    });

    const escapeCsvField = (field: string) =>
      /[",\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map(escapeCsvField).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-bulanan_${appliedRange.from}_${appliedRange.to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 flex flex-col min-h-full">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <label className="block mb-1 text-xs text-gray-500">
            {t("vehicle_detail.bbm.filter.label")}
          </label>
          <div className="flex items-center gap-2">
            <div className="w-36">
              <DatePicker
                value={draftRange.from}
                onChange={(val) =>
                  setDraftRange((prev) => ({ ...prev, from: val }))
                }
                placeholder={t("vehicle_detail.bbm.filter.from")}
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="w-36">
              <DatePicker
                value={draftRange.to}
                onChange={(val) =>
                  setDraftRange((prev) => ({ ...prev, to: val }))
                }
                placeholder={t("vehicle_detail.bbm.filter.to")}
              />
            </div>
            <button
              onClick={() => setAppliedRange(draftRange)}
              className="px-4 py-2 bg-[#00A1FE] text-white text-sm rounded-md hover:bg-[#048ad8] cursor-pointer"
            >
              {t("vehicle_detail.bbm.filter.apply")}
            </button>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A1FE] text-white text-sm rounded-md hover:bg-[#048ad8] cursor-pointer"
        >
          <Download size={16} />
          {t("monthly_recap.export_csv")}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <p className="text-xs text-gray-500">
            {t("monthly_recap.summary.total_km")}
          </p>
          <p className="text-xl font-semibold mt-1">
            {formatNumber(summary.total_km)} km
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <p className="text-xs text-gray-500">
            {t("monthly_recap.summary.total_liter")}
          </p>
          <p className="text-xl font-semibold mt-1">
            {formatNumber(summary.total_liters, 2)} L
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <p className="text-xs text-gray-500">
            {t("monthly_recap.summary.total_cost")}
          </p>
          <p className="text-xl font-semibold mt-1">
            {formatRupiah(summary.total_cost)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <p className="text-xs text-gray-500">
            {t("monthly_recap.summary.total_service")}
          </p>
          <p className="text-xl font-semibold mt-1">
            {formatNumber(summary.total_service)}
          </p>
        </div>
      </div>

      <h2 className="text-base font-semibold text-gray-800 mb-3">
        {t("monthly_recap.table.title")}
      </h2>

      <div className="rounded-xl overflow-hidden border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-[#E2E8F0]/20">
            <tr>
              <th className="text-left px-6 py-4 font-medium text-gray-500">
                {t("monthly_recap.table.vehicle").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.health").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.total_km").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.avg_km_per_day").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.service").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.inspection").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.fuel_count").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.liter").toUpperCase()}
              </th>
              <th className="text-center py-4 font-medium text-gray-500">
                {t("monthly_recap.table.cost").toUpperCase()}
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => {
                const healthConfig =
                  monthly_recap_health[getHealthStatus(row.health)];

                return (
                  <tr key={row.id} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-left">
                      <div className="flex flex-col">
                        <span className="text-gray-800 font-semibold">
                          {row.plate_number}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-xs font-medium ${healthConfig.bg} ${healthConfig.text} ${healthConfig.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${healthConfig.dot}`}
                        />
                        {healthConfig[lang]}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {formatNumber(row.total_km)}
                    </td>
                    <td className="py-4 text-center">
                      {formatNumber(row.avg_km_per_day, 1)}
                    </td>
                    <td className="py-4 text-center">
                      {formatNumber(row.service_count)}
                    </td>
                    <td className="py-4 text-center">
                      {formatNumber(row.inspection_count)}
                    </td>
                    <td className="py-4 text-center">
                      {formatNumber(row.fuel_count)}
                    </td>
                    <td className="py-4 text-center">
                      {formatNumber(row.fuel_liters, 2)}
                    </td>
                    <td className="py-4 text-center">
                      {formatRupiah(row.fuel_cost)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center p-6">
                  {t("common.no_data")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
