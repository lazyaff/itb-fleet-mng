"use client";

import { ConfirmationAlert } from "@/components/Alert";
import { DatePicker } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { bbm_payment_method, bbm_payment_method_color } from "@/src/dropdown";
import { formatedDate } from "@/utils/date";
import { DateTime } from "luxon";
import { ChevronLeft, ScrollText, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FuelLogFormModal from "./FuelLogFormModal";

export type FuelLog = {
  id: string;
  date: string;
  liters: number;
  cost: number;
  payment_method: string;
  receipt: string;
  notes: string | null;
  user: {
    id: string;
    name: string;
  };
};

export default function FuelLogTab({
  vehicleId,
  session,
  addFuelLog,
  setAddFuelLog,
}: {
  vehicleId: string;
  session: any;
  active: boolean;
  addFuelLog: boolean;
  setAddFuelLog: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const canManage = ["ADM", "SADM"].includes(session?.user?.role_id);

  const [records, setRecords] = useState<FuelLog[]>([]);
  const [summary, setSummary] = useState({
    total_liters: 0,
    total_cost: 0,
    total_entries: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [currentFuelData, setCurrentFuelData] = useState<{
    section: "" | "receipt";
    data: FuelLog | null;
  }>({ section: "", data: null });
  const [updateFuelLog, setUpdateFuelLog] = useState<{
    open: boolean;
    data: FuelLog | null;
  }>({ open: false, data: null });
  const [confirmAlert, setConfirmAlert] = useState<{
    visible: boolean;
    onConfirm: () => void;
  }>({ visible: false, onConfirm: () => {} });
  const [changePhoto, setChangePhoto] = useState(false);

  const defaultRange = {
    from: DateTime.now().minus({ days: 30 }).toISODate() as string,
    to: DateTime.now().toISODate() as string,
  };
  const [draftRange, setDraftRange] = useState(defaultRange);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchFuelData = async () => {
    try {
      const response = await fetch(
        `/api/v1/vehicle/fuel-log?id=${vehicleId}&page=${pagination.page}&size=10&from=${appliedRange.from}&to=${appliedRange.to}`,
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
        setRecords(result.data.records);
        setSummary(result.data.summary);
        setPagination((prev) => ({
          ...prev,
          totalPages: result.data.totalPage,
          totalRecords: result.data.totalRecords,
        }));
      } else if (result.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.log("Error fetching fuel log data:", error);
    }
  };

  const handleDeleteFuelLog = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/vehicle/fuel-log`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchFuelData();
      } else if (result.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.log("Error deleting fuel log data:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFuelData();
    }
  }, [session, pagination.page, appliedRange]);

  if (currentFuelData.section === "receipt" && currentFuelData.data) {
    return (
      <>
        <div className="w-full bg-gray-200 p-4">
          <button
            className="select-none flex items-center gap-1 cursor-pointer mb-4"
            onClick={() => {
              setCurrentFuelData({ section: "", data: null });
            }}
          >
            <ChevronLeft />
            <p className="font-bold">{t("vehicle_detail.bbm.back")}</p>
          </button>
          <img
            src={currentFuelData.data.receipt || "/image/placeholder.webp"}
            width={500}
            height={500}
            alt="Receipt"
            className="w-full h-auto px-2 pb-3"
          />
          {canManage && (
            <button
              onClick={() => setChangePhoto(true)}
              className="px-4 py-2 bg-[#00A1FE] text-white text-sm rounded-md hover:bg-[#048ad8] cursor-pointer"
            >
              {t("vehicle_detail.bbm.change_photo")}
            </button>
          )}
        </div>

        <FuelLogFormModal
          open={addFuelLog}
          mode="add"
          vehicleId={vehicleId}
          session={session}
          onClose={() => setAddFuelLog(false)}
          onSaved={fetchFuelData}
        />

        <FuelLogFormModal
          open={changePhoto}
          mode="edit"
          vehicleId={vehicleId}
          session={session}
          initialData={currentFuelData.data}
          onClose={() => setChangePhoto(false)}
          onSaved={async () => {
            await fetchFuelData();
            setCurrentFuelData({ section: "", data: null });
          }}
        />
      </>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-end gap-3 mb-6">
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
            </div>
          </div>
          <button
            onClick={() => {
              setAppliedRange(draftRange);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-[#00A1FE] text-white text-sm rounded-md hover:bg-[#048ad8] cursor-pointer"
          >
            {t("vehicle_detail.bbm.filter.apply")}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500">
              {t("vehicle_detail.bbm.summary.total_fuel")}
            </p>
            <p className="text-xl font-semibold mt-1">
              {summary.total_liters.toLocaleString("en-US", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}{" "}
              L
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500">
              {t("vehicle_detail.bbm.summary.total_cost")}
            </p>
            <p className="text-xl font-semibold mt-1">
              Rp {summary.total_cost.toLocaleString("en-US")}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500">
              {t("vehicle_detail.bbm.summary.total_entries")}
            </p>
            <p className="text-xl font-semibold mt-1">
              {summary.total_entries}
            </p>
          </div>
        </div>

        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-[#E2E8F0]/20">
            <tr>
              <th className="text-center py-4 font-normal text-gray-500">
                {t("vehicle_detail.bbm.table.date").toUpperCase()}
              </th>
              <th className="text-center py-4 font-normal text-gray-500">
                {t("vehicle_detail.bbm.table.fuel").toUpperCase()}
              </th>
              <th className="text-center py-4 font-normal text-gray-500">
                {t("vehicle_detail.bbm.table.cost").toUpperCase()}
              </th>
              <th className="text-center py-4 font-normal text-gray-500">
                {t("vehicle_detail.bbm.table.payment_method").toUpperCase()}
              </th>
              <th className="text-center py-4 font-normal text-gray-500">
                {t("vehicle_detail.bbm.table.receipt").toUpperCase()}
              </th>
              {canManage && (
                <th className="text-center py-4 font-normal text-gray-500">
                  {t("vehicle_detail.bbm.table.action").toUpperCase()}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {records && records.length > 0 ? (
              records.map((item) => {
                const config =
                  bbm_payment_method_color[
                    item.payment_method as keyof typeof bbm_payment_method_color
                  ];
                const paymentLabel =
                  bbm_payment_method.find((m) => m.id === item.payment_method)
                    ?.label || item.payment_method;

                return (
                  <tr key={item.id} className="border-t border-gray-200">
                    <td className="py-4 text-center">
                      {formatedDate(new Date(item.date), "dd/MM/yyyy")}
                    </td>
                    <td className="py-4 text-center">
                      {item.liters.toLocaleString("en-US", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}{" "}
                      L
                    </td>
                    <td className="py-4 text-center">
                      Rp {item.cost.toLocaleString("en-US")}
                    </td>
                    <td className="py-4 text-center">
                      {config ? (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          {paymentLabel}
                        </span>
                      ) : (
                        paymentLabel
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <button
                        className="cursor-pointer text-[#00A1FE]"
                        onClick={() => {
                          setCurrentFuelData({
                            section: "receipt",
                            data: item,
                          });
                        }}
                      >
                        {t("vehicle_detail.bbm.see_receipt")}
                      </button>
                    </td>
                    {canManage && (
                      <td className="py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                            onClick={() => {
                              setConfirmAlert({
                                visible: true,
                                onConfirm: async () => {
                                  await handleDeleteFuelLog(item.id);
                                },
                              });
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                            onClick={() => {
                              setUpdateFuelLog({ open: true, data: item });
                            }}
                          >
                            <ScrollText className="mt-0.5" size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="text-center p-6">
                  {t("common.no_data")}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {records && records.length !== 0 && (
          <Pagination
            totalPages={pagination.totalPages}
            currentPage={pagination.page}
            onPageChange={(page) => {
              setPagination((prev) => ({ ...prev, page }));
            }}
          />
        )}
      </div>

      <FuelLogFormModal
        open={addFuelLog}
        mode="add"
        vehicleId={vehicleId}
        session={session}
        onClose={() => setAddFuelLog(false)}
        onSaved={fetchFuelData}
      />

      <FuelLogFormModal
        open={updateFuelLog.open}
        mode="edit"
        vehicleId={vehicleId}
        session={session}
        initialData={updateFuelLog.data}
        onClose={() => setUpdateFuelLog({ open: false, data: null })}
        onSaved={fetchFuelData}
      />

      <ConfirmationAlert
        title={t("gps_tracker.delete_confirm")}
        subtitle={t("gps_tracker.delete_warning")}
        type="delete"
        visible={confirmAlert.visible}
        onCancel={() => {
          setConfirmAlert({ visible: false, onConfirm: () => {} });
        }}
        onConfirm={() => {
          setConfirmAlert({ visible: false, onConfirm: () => {} });
          setTimeout(() => confirmAlert.onConfirm(), 300);
        }}
      />
    </>
  );
}
