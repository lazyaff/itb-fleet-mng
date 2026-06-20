"use client";

import { ConfirmationAlert, NotificationAlert } from "@/components/Alert";
import { FilterButtonGroup } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { approvalStatus, syncStatus } from "@/src/dropdown";
import { CircleAlert, RefreshCw, Search, SendHorizontal } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  plate_number: string;
  name: string;
  sync_status: string;
  visibility: boolean;
};

type SyncedVehicleProps = {
  plate_number: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  plate_color: string | null;
  type: string | null;
  assigned_unit: string | null;
  usage_type: string | null;
  status: string;
  selected: boolean;
};

export default function Sync() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fetchVehicle, setFetchVehicle] = useState(false);
  const [section, setSection] = useState<"registry" | "sync">("registry");
  const [progress, setProgress] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filteredData, setFilteredData] = useState<DataProps[]>([]);
  const [syncedVehicleData, setSyncedVehicleData] = useState<
    SyncedVehicleProps[]
  >([]);
  const [sentData, setSentData] = useState<SyncedVehicleProps[]>([]);
  const [dataCount, setDataCount] = useState({
    total: 0,
    synced: 0,
    not_synced: 0,
  });
  const [version, setVersion] = useState({
    current: 0,
    published: null,
  });
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "default";
    title: string;
    subtitle?: string;
    onClose: () => void;
  }>({
    visible: false,
    type: "default",
    title: "",
    subtitle: "",
    onClose: () => {},
  });
  const [confirmAlert, setConfirmAlert] = useState<{
    visible: boolean;
    message: string;
    subtitle: string;
    type: "delete" | "password" | "default";
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    visible: false,
    message: "",
    subtitle: "",
    type: "default",
    onConfirm: () => {},
    onCancel: () => {},
  });

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.admin"),
      subtitle: t("sidebar.vehicle_sync"),
    });
  }, [lang]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [pagination.page]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/vehicle-sync/registered?page=${pagination.page}&size=10`,
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
        setFilteredData(result.data.records);
        setVersion(result.data.version);
        setDataCount({
          total: result.data.totalRecords,
          synced: result.data.totalSynced,
          not_synced: result.data.totalNotSynced,
        });
        setPagination({
          ...pagination,
          totalPages: result.data.totalPages,
          totalRecords: result.data.totalRecords,
        });
      } else {
        if (result.status === 401) {
          handleLogout();
        } else {
          throw new Error("Failed to fetch data");
        }
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      if (!id || loading || fetchVehicle) {
        return;
      }

      setLoading(true);

      const response = await fetch(`/api/v1/vehicle-sync/visible`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
        setAlert({
          visible: true,
          type: "success",
          title: t("form.success_title"),
          subtitle: t("form.update_success"),
          onClose: () => {},
        });
      } else {
        if (result.status === 401) {
          handleLogout();
        } else {
          setAlert({
            visible: true,
            type: "error",
            title: t("form.error_title"),
            subtitle: result.message,
            onClose: () => {},
          });
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error adding bus:", error);
      setAlert({
        visible: true,
        type: "error",
        title: t("form.error_title"),
        subtitle: t("form.error_generic"),
        onClose: () => {},
      });
      setLoading(false);
    }
  };

  const handleFetchVehicle = async () => {
    if (fetchVehicle || loading) return;

    setFetchVehicle(true);
    setProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 8;
      if (current >= 90) current = 90;
      setProgress(Math.floor(current));
    }, 150);

    try {
      const response = await fetch("/api/v1/vehicle-sync", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json();

      clearInterval(interval);
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (result.success) {
        setSyncedVehicleData(result.data);
        setSection("sync");
      } else {
        if (result.status === 401) {
          handleLogout();
        } else {
          throw new Error("Failed to fetch data");
        }
      }
    } catch (error) {
      clearInterval(interval);
      console.log(error);
    } finally {
      setFetchVehicle(false);
    }
  };

  const filteredSyncedVehicleData = useMemo(() => {
    const keyword = search.toLowerCase();

    return syncedVehicleData.filter(
      (vehicle: any) =>
        [
          vehicle.plate_number,
          vehicle.name,
          vehicle.brand,
          vehicle.category,
          vehicle.plate_color,
          vehicle.type,
          vehicle.assigned_unit,
          vehicle.usage_type,
        ].some((value) => value?.toLowerCase().includes(keyword)) &&
        vehicle.status?.toLowerCase().includes(status.toLowerCase()),
    );
  }, [syncedVehicleData, search, status]);

  return (
    <div className="relative h-full max-h-none">
      <div className={`p-4 flex flex-col min-h-full`}>
        <div className="mb-6 flex flex-col items-start gap-2">
          <div className="flex flex-row w-full items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {t("vehicle_sync.title_1")}
              </h1>
              {section === "registry" ? (
                <p className="text-gray-500">{t("vehicle_sync.not_synced")}</p>
              ) : (
                <p className="text-gray-500">
                  {syncedVehicleData.length} {t("vehicle_sync.fetched")}
                </p>
              )}
            </div>
            <div className="flex flex-row justify-end gap-4 items-end">
              {section === "registry" ? (
                <button
                  onClick={() => handleFetchVehicle()}
                  className={`font-medium px-6 text-white py-2 rounded-lg select-none ${fetchVehicle ? "bg-gray-400" : "bg-[#00A1FE] hover:bg-[#048ad8]"} cursor-pointer items-center flex gap-4`}
                >
                  <RefreshCw size={14} /> {t("vehicle_sync.reload")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSection("registry");
                      setSyncedVehicleData([]);
                      setSearch("");
                      setStatus("");
                    }}
                    className="font-medium px-6 text-black border border-gray-500 py-2 rounded-lg bg-white hover:bg-gray-200 select-none cursor-pointer items-center flex gap-4"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    // onClick={handleUpdateService}
                    className={`font-medium px-6 bg-[#00A1FE] text-white py-2 rounded-lg select-none hover:bg-[#048ad8] cursor-pointer items-center flex gap-4`}
                  >
                    <SendHorizontal size={14} strokeWidth={2} />{" "}
                    {t("vehicle_sync.send")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {section === "registry" ? (
          <>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-72 mb-6">
              {fetchVehicle ? (
                <div className="flex flex-col items-center justify-center min-h-72 gap-4">
                  <p className="font-semibold text-gray-600">
                    {t("vehicle_sync.fetching")}
                  </p>

                  <div className="w-112.5 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <p className="text-gray-500">{progress}%</p>
                </div>
              ) : (
                <>
                  {syncedVehicleData.length === 0 ? (
                    <div className="text-gray-400 flex flex-col justify-center items-center h-72 gap-1.5">
                      <RefreshCw
                        size={60}
                        strokeWidth={2.5}
                        className="text-[#7B7B7B]/37"
                      />
                      <p className="font-bold text-lg mt-2">
                        {t("vehicle_sync.no_active_sync_title")}
                      </p>
                      <p>{t("vehicle_sync.no_active_sync_subtitle")}</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-[#E2E8F0]/20">
                        <tr className="border-b border-gray-300">
                          <th className="px-6 py-3 text-center">
                            {t(
                              "vehicle_sync.table.vehicle_plate",
                            ).toUpperCase()}
                          </th>
                          <th className="px-6 py-3 text-center">
                            {t("vehicle_sync.table.vehicle").toUpperCase()}
                          </th>
                          <th className="px-6 py-3 text-center">STATUS</th>
                        </tr>
                      </thead>

                      <tbody>
                        {syncedVehicleData.map((item, index) => (
                          <tr
                            key={index}
                            className={`border-b border-gray-300`}
                          >
                            <td className="px-6 py-3 text-gray-800 text-center">
                              {item.plate_number}
                            </td>

                            <td className="px-6 py-3 text-gray-800 text-center">
                              {item.name}
                            </td>

                            <td className="px-6 py-3 text-gray-800 text-center">
                              {(() => {
                                const config =
                                  syncStatus[
                                    item.status as keyof typeof syncStatus
                                  ];

                                if (!config) return item.status;

                                return (
                                  <span
                                    className={`py-0.5 text-xs px-2 border font-medium ${config.bg} ${config.text} ${config.border} rounded-lg`}
                                  >
                                    {t(`my_request.${item.status}`)}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                {t("vehicle_sync.title_2")}
              </h1>
              <p className="text-gray-500">
                {dataCount.total} {t("vehicle_sync.saved")} -{" "}
                <span className="font-semibold">
                  {dataCount.synced} {t("vehicle_sync.synced")}
                </span>{" "}
                - {dataCount.not_synced} {t("vehicle_sync.not_sync")}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
              <table className="w-full">
                <thead className="bg-[#E2E8F0]/20">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center">
                      {t("vehicle_sync.table.vehicle_plate").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle_sync.table.vehicle").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">STATUS</th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle_sync.table.visibility").toUpperCase()}
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className={`border-b border-gray-300`}>
                      <td className="px-6 py-3 text-gray-800 text-center">
                        {item.plate_number}
                      </td>

                      <td className="px-6 py-3 text-gray-800 text-center">
                        {item.name}
                      </td>

                      <td className="px-6 py-3 text-gray-800 text-center">
                        {(() => {
                          const config =
                            syncStatus[
                              item.sync_status as keyof typeof syncStatus
                            ];

                          if (!config) return item.sync_status;

                          return (
                            <span
                              className={`py-0.5 text-xs px-2 border font-medium ${config.bg} ${config.text} ${config.border} rounded-lg`}
                            >
                              {t(`my_request.${item.sync_status}`)}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => {
                            if (session.user.role_id === "UOPS") return;
                            handleToggleVisibility(item.id);
                          }}
                          className={`w-12 h-6 mx-auto rounded-full flex items-center transition-colors duration-300 cursor-pointer ${
                            !item.visibility ? "bg-gray-300" : "bg-[#00A1FE]"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                              !item.visibility
                                ? "translate-x-[0.2rem]"
                                : "translate-x-[1.6rem]"
                            }`}
                          ></span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* pagination */}
              {filteredData.length !== 0 && (
                <Pagination
                  totalPages={pagination.totalPages}
                  currentPage={pagination.page}
                  onPageChange={(page) =>
                    setPagination({ ...pagination, page })
                  }
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-row justify-start items-end gap-3">
              <div className="bg-white border-2 border-green-500 rounded-md flex items-center p-4 text-green-500 gap-2 font-semibold text-xs">
                <span className="text-black text-xl font-bold">
                  {
                    syncedVehicleData.filter((item) => item.status === "new")
                      .length
                  }
                </span>
                {t("my_request.new")}
              </div>
              <div className="bg-white border-2 border-blue-500 rounded-md flex items-center p-4 text-blue-500 gap-2 font-semibold text-xs">
                <span className="text-black text-xl font-bold">
                  {
                    syncedVehicleData.filter((item) => item.status === "synced")
                      .length
                  }
                </span>
                {t("my_request.synced")}
              </div>
              <div className="bg-white border-2 border-yellow-500 rounded-md flex items-center p-4 text-yellow-500 gap-2 font-semibold text-xs">
                <span className="text-black text-xl font-bold">
                  {
                    syncedVehicleData.filter(
                      (item) => item.status === "conflict",
                    ).length
                  }
                </span>
                {t("my_request.conflict")}
              </div>
              {syncedVehicleData.filter((item) => item.status === "conflict")
                .length > 0 && (
                <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-md py-1.5 px-3 text-gray-500 flex">
                  <CircleAlert
                    size={14}
                    className="text-[#F59F0A] inline mr-1.5 mt-0.5"
                  />
                  <div>
                    {" "}
                    {
                      syncedVehicleData.filter(
                        (item) => item.status === "conflict",
                      ).length
                    }{" "}
                    {t("vehicle_sync.warning_prefix")}{" "}
                    <span className="font-bold">
                      {t("vehicle_sync.not_sync")}
                    </span>{" "}
                    {t("vehicle_sync.warning_suffix")}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-4">
              <div className="flex items-center bg-white w-80 px-3 py-2 border border-gray-200 rounded-md shadow">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder={t("vehicle_sync.search_placeholder")}
                  className="w-full bg-transparent outline-none"
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
              </div>
              <FilterButtonGroup
                items={Object.entries(syncStatus).slice(0, 3)}
                value={status}
                onChange={setStatus}
                allLabel={lang === "id" ? "Semua" : "All"}
                getValue={([key]) => key}
                getLabel={([, item]) =>
                  lang === "id" ? item.label_id : item.label_en
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Alert */}
      <NotificationAlert
        title={alert.title}
        subtitle={alert.subtitle}
        visible={alert.visible}
        type={alert.type}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          setTimeout(() => alert.onClose(), 300);
        }}
      />

      {/* Confirm Alert */}
      <ConfirmationAlert
        title={confirmAlert.message}
        subtitle={confirmAlert.subtitle}
        type={confirmAlert.type}
        visible={confirmAlert.visible}
        onCancel={() => {
          setConfirmAlert({ ...confirmAlert, visible: false });
          setTimeout(() => confirmAlert.onCancel(), 300);
        }}
        onConfirm={() => {
          setLoading(true);
          setConfirmAlert({ ...confirmAlert, visible: false });
          setTimeout(() => confirmAlert.onConfirm(), 300);
        }}
      />
    </div>
  );
}
