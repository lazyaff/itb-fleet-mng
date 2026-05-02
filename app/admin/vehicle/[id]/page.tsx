"use client";

import { ConfirmationAlert, NotificationAlert } from "@/components/Alert";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { vehicle_status, vehicle_status_color } from "@/src/dropdown";
import { formatedDate } from "@/utils/date";
import {
  Activity,
  Circle,
  Clock,
  Info,
  ShieldAlert,
  SquarePen,
  Trash2,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { DateTime } from "luxon";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useContext, useEffect, useState } from "react";

export type VehicleDetail = {
  vehicle: Vehicle;
  parts: VehiclePart[];
  alert: VehicleAlert[];
};

export type Vehicle = {
  id: string;
  image: string;
  plate_number: string;
  name: string;
  status: "Available" | "In Use" | "Maintenance" | string;
  last_update: string | null;
  health: number;
  current_mileage: number;
  next_service: NextService;
};

export type NextService = {
  time_limit: number;
  distance_limit: number;
};

export type VehiclePart = {
  id: string;
  general_vehicle_part_id: string;
  title: string;
  current_mileage: number;
  distance_limit: number;
  last_service: string; // ISO date
  time_limit: number;
  notes: string | null;
  health: number;
};

export type VehicleAlert = {
  title: string;
  health: number;
};

export type ServiceHistory = {
  no: number;
  id: string;
  vehicle: {
    id: string;
    plate_number: string;
  };
  user: {
    id: string;
    name: string;
  };
  image: string;
  date: string;
  current_mileage: number;
  cost: number;
  notes: string;
  parts: ServiceHistoryPart[];
  is_all: boolean;
};

export type ServiceHistoryPart = {
  id: string;
  name: string;
};

export default function VehicleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const current_section = searchParams.get("section");
    const { data: session } = useSession() as { data: any };
    const { loading, setLoading } = useContext(LoadingContext);
    const { setPageInfo } = useContext(PageInfoContext);
    const router = useRouter();
    const { t, lang } = useLanguage();
    const [section, setSection] = useState(current_section || "parts");
    const [data, setData] = useState<VehicleDetail>();
    const [serviceData, setServiceData] = useState<ServiceHistory[]>();
    const [servicePagination, setServicePagination] = useState({
      page: 1,
      totalPages: 1,
      totalRecords: 0,
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
      onConfirm: () => void;
      onCancel: () => void;
    }>({
      visible: false,
      message: "",
      onConfirm: () => {},
      onCancel: () => {},
    });
    const [updateKM, setUpdateKM] = useState<{
      open: boolean;
      data: {
        id: string;
        name: string;
        current_mileage: number;
      };
    }>({
      open: false,
      data: {
        id: "",
        name: "",
        current_mileage: 0,
      },
    });
    const [addPart, setAddPart] = useState<{
      open: boolean;
      data: {
        name: string;
        distance_limit: number;
        time_limit: number;
        last_service: string;
        current_distance: number;
      };
    }>({
      open: false,
      data: {
        name: "",
        distance_limit: 0,
        time_limit: 0,
        last_service: "",
        current_distance: 0,
      },
    });
    const [updatePart, setUpdatePart] = useState<{
      open: boolean;
      data: {
        id: string;
        general_vehicle_part_id: string;
        name: string;
        distance_limit: number;
        time_limit: number;
        last_service: string;
        current_distance: number;
      };
    }>({
      open: false,
      data: {
        id: "",
        general_vehicle_part_id: "",
        name: "",
        distance_limit: 0,
        time_limit: 0,
        last_service: "",
        current_distance: 0,
      },
    });

    useEffect(() => {
      setPageInfo({
        title: t("sidebar.vehicle_list"),
        subtitle: t("sidebar.vehicle_list"),
      });
    }, [lang]);

    const handleLogout = () => {
      signOut({ redirect: false }).then(() => router.push("/"));
    };

    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/vehicle/parts?id=" + id, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.access_token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            handleLogout();
            return;
          }
          throw new Error(res.statusText);
        }
        const response = await res.json();
        setData(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchServiceData = async () => {
      try {
        const response = await fetch(
          `/api/v1/vehicle/service?id=${id}&page=${servicePagination.page}&size=10`,
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
          setServiceData(result.data.records);
          setServicePagination({
            ...servicePagination,
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

    useEffect(() => {
      if (session && !data) {
        fetchData();
        fetchServiceData();
      }
    }, [session]);

    const handleUpdateKM = async () => {
      try {
        const { id, name, current_mileage } = updateKM.data;
        if (!id || !name || current_mileage === null || loading) {
          return;
        }

        setUpdateKM({ ...updateKM, open: false });
        setLoading(true);

        const response = await fetch(`/api/v1/vehicle`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            name,
            current_mileage: current_mileage * 1000,
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
              onClose: () => {
                setUpdateKM({
                  ...updateKM,
                  open: true,
                });
              },
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
          onClose: () => {
            setUpdateKM({
              ...updateKM,
              open: true,
            });
          },
        });
        setLoading(false);
      }
    };

    const handleAddPart = async () => {
      try {
        const {
          name,
          current_distance,
          distance_limit,
          last_service,
          time_limit,
        } = addPart.data;
        if (
          !name ||
          current_distance === null ||
          distance_limit === null ||
          !last_service ||
          time_limit === null ||
          loading
        ) {
          return;
        }

        setAddPart({ ...addPart, open: false });
        setLoading(true);

        const response = await fetch(`/api/v1/vehicle/parts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vehicle_id: id,
            name,
            distance_limit: distance_limit,
            time_limit: time_limit,
            last_service: last_service,
            current_distance: current_distance * 1000,
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
              onClose: () => {
                setAddPart({
                  ...addPart,
                  open: true,
                });
              },
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
          onClose: () => {
            setAddPart({
              ...addPart,
              open: true,
            });
          },
        });
        setLoading(false);
      }
    };

    const handleUpdatePart = async () => {
      try {
        const {
          id,
          name,
          current_distance,
          distance_limit,
          last_service,
          time_limit,
        } = updatePart.data;
        if (
          !id ||
          !name ||
          current_distance === null ||
          distance_limit === null ||
          !last_service ||
          time_limit === null ||
          loading
        ) {
          return;
        }

        setUpdatePart({ ...updatePart, open: false });
        setLoading(true);

        const response = await fetch(`/api/v1/vehicle/parts`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            name,
            distance_limit: distance_limit,
            time_limit: time_limit,
            last_service: last_service,
            current_distance: current_distance * 1000,
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
              onClose: () => {
                setUpdatePart({
                  ...updatePart,
                  open: true,
                });
              },
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
          onClose: () => {
            setUpdatePart({
              ...updatePart,
              open: true,
            });
          },
        });
        setLoading(false);
      }
    };

    const handleDeletePart = async (id: string) => {
      try {
        if (!id || loading) {
          return;
        }

        setLoading(true);

        const response = await fetch(`/api/v1/vehicle/parts`, {
          method: "DELETE",
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
            subtitle: t("form.delete_success"),
            onClose: () => {
              setAlert({
                visible: false,
                title: "",
                subtitle: "",
                type: "default",
                onClose: () => {},
              });
            },
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
              onClose: () => {
                setAlert({
                  visible: false,
                  title: "",
                  subtitle: "",
                  type: "default",
                  onClose: () => {},
                });
              },
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
          onClose: () => {
            setAlert({
              visible: false,
              title: "",
              subtitle: "",
              type: "default",
              onClose: () => {},
            });
          },
        });
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col gap-4 w-full h-full min-h-[70dvh]">
        <button
          onClick={() => {
            setLoading(true);
            router.push("/admin/vehicle");
          }}
          className="bg-[#00A1FE] w-fit hover:bg-[#048ad8] text-white py-[0.6rem] px-10 rounded-md cursor-pointer select-none flex items-center gap-3"
        >
          {t("vehicle_detail.overview.close_overview")}
        </button>

        {/* MAIN CONTENT */}
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-[45%] flex flex-col gap-4 h-full">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 max-w-1/2">
                  <h2 className="font-semibold text-lg">
                    {data?.vehicle.name || "-"}{" "}
                    {/* {data?.vehicle.health && data.vehicle.health < 25 && (
                      <CircleAlert
                        className="ml-1 inline mb-0.5 text-red-500"
                        size={20}
                        strokeWidth={3}
                      />
                    )} */}
                  </h2>

                  {data?.vehicle.last_update && (
                    <p className="text-xs text-gray-500">
                      <Clock size={14} className="inline mr-0.5 mb-0.5" />{" "}
                      {t("vehicle_detail.overview.last_update")}{" "}
                      {formatedDate(
                        new Date(data?.vehicle.last_update),
                        "dd/MM/yyyy",
                      )}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-1 max-w-[50%]">
                  <span className="inline-flex items-center px-1.5 rounded-md border text-xs font-medium bg-gray-100 text-black border-black">
                    {data?.vehicle.plate_number}
                  </span>

                  {(() => {
                    const config =
                      vehicle_status_color[
                        data?.vehicle
                          .status as keyof typeof vehicle_status_color
                      ];

                    if (!config) return data?.vehicle.status;

                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        />
                        {vehicle_status.find(
                          (x) => x.en === data?.vehicle.status,
                        )?.[lang] || data?.vehicle.status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="w-full h-[23dvh] flex flex-row gap-4 overflow-hidden">
                <img
                  src={data?.vehicle.image || "/image/placeholder.webp"}
                  className="w-1/2 h-full object-cover rounded-lg"
                  alt="vehicle"
                />
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-3 text-sm w-full">
                    <div>
                      <p className="text-gray-400 text-xs">
                        {t("vehicle_detail.overview.next_service")}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          data?.vehicle.next_service.time_limit &&
                          data.vehicle.next_service.time_limit > 0
                            ? ""
                            : "text-red-500"
                        }`}
                      >
                        {data?.vehicle.next_service.time_limit &&
                        data.vehicle.next_service.time_limit > 0
                          ? require("luxon")
                              .DateTime.now()
                              .setZone("Asia/Jakarta")
                              .plus({
                                days: data.vehicle.next_service.time_limit,
                              })
                              .toFormat("dd/MM/yyyy")
                          : t("vehicle.overdue")}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          data?.vehicle.next_service.distance_limit &&
                          data.vehicle.next_service.distance_limit > 0
                            ? ""
                            : "text-red-500"
                        }`}
                      >
                        {data?.vehicle.next_service.distance_limit &&
                        data.vehicle.next_service.distance_limit > 0
                          ? data.vehicle.next_service.distance_limit + " km"
                          : t("vehicle.overdue")}
                      </p>
                    </div>

                    <div className="text-end">
                      <p className="text-gray-400 text-xs">
                        {t("vehicle_detail.overview.overall_health")}
                      </p>
                      <p className="font-bold text-xl">
                        <Circle
                          size={10}
                          className={`inline ${data?.vehicle.health && data.vehicle.health > 50 ? "text-green-500 bg-green-500" : data?.vehicle.health && data.vehicle.health >= 25 ? "text-yellow-500 bg-yellow-500" : "bg-red-500 text-red-500"} rounded-full mb-1 mr-1`}
                        />
                        {data?.vehicle.health || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 border rounded-lg shadow p-3 border-gray-200 flex flex-row justify-between">
                    <div>
                      <p className="text-xs">Total KM</p>
                      <p className="text-xl font-bold mt-2">
                        {Math.floor(
                          (data?.vehicle.current_mileage || 0) / 1000,
                        ).toLocaleString("en-US")}
                      </p>
                      <button
                        className="cursor-pointer text-[#00A1FE] text-xs"
                        onClick={async () => {
                          setUpdateKM({
                            open: true,
                            data: {
                              id: id,
                              name: data?.vehicle.name || "",
                              current_mileage: Math.floor(
                                (data?.vehicle.current_mileage || 0) / 1000,
                              ),
                            },
                          });
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <TrendingUp size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM CARD */}
            <div className="bg-white rounded-xl shadow p-4 flex-1 overflow-auto min-h-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-base">
                  {t("vehicle_detail.user_usage.title")}
                </h3>
                <button className="text-sm border border-gray-300 px-4 py-1 rounded-md text-[#00A1FE] cursor-pointer select-none">
                  {t("vehicle_detail.user_usage.view")}
                </button>
              </div>

              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-[#E2E8F0]/20">
                  <tr>
                    <th className="text-center py-4">
                      {t(
                        "vehicle_detail.user_usage.table.renter",
                      ).toUpperCase()}
                    </th>
                    <th className="text-center py-4">
                      {t("vehicle_detail.user_usage.table.date").toUpperCase()}
                    </th>
                    <th className="text-center py-4">
                      {t(
                        "vehicle_detail.user_usage.table.distance",
                      ).toUpperCase()}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {[1, 2, 3, 4, 6, 7, 8, 9, 10].map((_, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="py-4 text-center">Renter {i + 1}</td>
                      <td className="py-4 text-center">12/12/2025</td>
                      <td className="font-semibold py-4 text-center">
                        +100 km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT SIDE (55%) */}
          <div className="w-[55%] bg-white rounded-xl shadow p-4 flex flex-col min-h-0 h-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-96 flex bg-gray-200 py-1.5 px-2 font-semibold rounded-2xl">
                <div
                  className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] bg-white rounded-xl transition-transform duration-300 ease-in-out"
                  style={{
                    transform:
                      section === "parts"
                        ? "translateX(0%)"
                        : section === "services"
                          ? "translateX(100%)"
                          : "translateX(200%)",
                  }}
                />

                {/* BUTTONS */}
                <button
                  onClick={() => setSection("parts")}
                  className={`relative z-10 flex-1 px-1 py-1 rounded-xl text-sm cursor-pointer ${section !== "parts" ? "text-[#64748B]" : ""}`}
                >
                  {t("vehicle_detail.navbar.part_health")}
                </button>

                <button
                  onClick={() => setSection("services")}
                  className={`relative z-10 flex-1 px-1 py-1 rounded-xl text-sm cursor-pointer ${section !== "services" ? "text-[#64748B]" : ""}`}
                >
                  {t("vehicle_detail.navbar.service_history")}
                </button>

                <button
                  onClick={() => setSection("alerts")}
                  className={`relative z-10 flex-1 px-1 py-1 rounded-xl text-sm cursor-pointer ${section !== "alerts" ? "text-[#64748B]" : ""}`}
                >
                  {t("vehicle_detail.navbar.active_alerts")}
                </button>
              </div>
              <button
                onClick={() => {
                  if (section === "parts") {
                    setAddPart({
                      open: true,
                      data: {
                        name: "",
                        current_distance: 0,
                        distance_limit: 0,
                        last_service: "",
                        time_limit: 0,
                      },
                    });
                  }
                }}
                className={`border transition-all duration-500 px-3 py-1.5 rounded-xl border-dashed text-sm cursor-pointer ${section !== "alerts" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
              >
                + {t("common.add")}
              </button>
            </div>

            <div className="flex-1 overflow-auto relative min-h-0">
              <div
                className={`min-h-full transition-all duration-500 z-20 absolute top-0 left-0 w-full ${
                  section === "parts"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                {data?.parts && data.parts.length > 0 ? (
                  data.parts.map((part) => (
                    <div
                      key={part.id}
                      className="rounded-2xl shadow-md mb-3 bg-[#E2E8F0]/25 p-4"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="w-2/3 flex flex-row items-start gap-2 pr-4">
                          <div>
                            <p className="font-semibold text-base">
                              {part.title}
                            </p>
                            <p className="text-gray-600">
                              <Activity className="inline" size={14} />{" "}
                              {Math.floor(
                                part.current_mileage / 1000,
                              ).toLocaleString("en-US")}{" "}
                              {t("vehicle_detail.part.km_last_service")}
                            </p>
                            <p className="text-gray-600">
                              <Clock className="inline mb-1" size={14} />{" "}
                              {Math.floor(
                                DateTime.now().diff(
                                  require("luxon")
                                    .DateTime.fromISO(part.last_service)
                                    .setZone("Asia/Jakarta"),
                                  "days",
                                ).days,
                              ).toLocaleString("en-US")}{" "}
                              {t("vehicle_detail.part.days_last_service")}
                            </p>
                          </div>
                        </div>

                        <div className="w-1/3 flex justify-end">
                          <div className="text-end">
                            <p
                              className={`font-semibold text-base ${part.health < 25 ? "text-red-500" : ""}`}
                            >
                              {part.health}% {t("vehicle_detail.alert.health")}
                            </p>
                            <p className="text-gray-600">
                              {t("vehicle_detail.part.limit_km")}:{" "}
                              {Math.floor(
                                part.current_mileage / 1000,
                              ).toLocaleString("en-US")}
                              /{part.distance_limit.toLocaleString("en-US")}
                            </p>
                            <p className="text-gray-600">
                              {t("vehicle_detail.part.limit_time")}:{" "}
                              {Math.floor(
                                DateTime.now().diff(
                                  require("luxon")
                                    .DateTime.fromISO(part.last_service)
                                    .setZone("Asia/Jakarta"),
                                  "days",
                                ).days,
                              ).toLocaleString("en-US")}
                              /{(part.time_limit * 30).toLocaleString("en-US")}
                            </p>
                            <div className="flex gap-2 justify-end mt-2">
                              {!part.general_vehicle_part_id && (
                                <button
                                  className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                                  onClick={() => {
                                    setConfirmAlert({
                                      visible: true,
                                      message: t("gps_tracker.delete_confirm"),
                                      onConfirm: async () => {
                                        await handleDeletePart(part.id);
                                      },
                                      onCancel: () => {
                                        setConfirmAlert({
                                          visible: false,
                                          message: "",
                                          onConfirm: () => {},
                                          onCancel: () => {},
                                        });
                                      },
                                    });
                                  }}
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                              <button
                                className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                                onClick={() => {
                                  setUpdatePart({
                                    open: true,
                                    data: {
                                      id: part.id,
                                      general_vehicle_part_id:
                                        part.general_vehicle_part_id,
                                      name: part.title,
                                      current_distance: Math.floor(
                                        part.current_mileage / 1000,
                                      ),
                                      distance_limit: part.distance_limit,
                                      last_service: part.last_service,
                                      time_limit: part.time_limit,
                                    },
                                  });
                                }}
                              >
                                <SquarePen className="mt-0.5" size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 mt-3 bg-gray-200 rounded flex-1">
                        <div
                          className={`h-2 ${part.health > 50 ? "bg-[#16A249]" : part.health >= 25 ? "bg-[#FFC107]" : "bg-[#DC3545]"} rounded`}
                          style={{
                            width: `${part.health}%`,
                          }}
                        ></div>
                      </div>
                      {part.health < 25 && (
                        <div className="mt-4 bg-[#EF4444]/5 border-[#EF4444]/20 p-4 text-red-500 rounded-xl border">
                          <div className="w-2/3 flex flex-row items-center gap-3 pr-4">
                            <ShieldAlert size={26} />
                            <div>
                              <p className="font-semibold">
                                {" "}
                                {t("vehicle_detail.part.service_required")}
                              </p>
                              <p>
                                {t("vehicle_detail.part.triggered_by")}:{" "}
                                <b>
                                  {[
                                    Math.floor(part.current_mileage / 1000) >
                                      part.distance_limit * 0.75 && "KM",
                                    Math.floor(
                                      DateTime.now().diff(
                                        require("luxon")
                                          .DateTime.fromISO(part.last_service)
                                          .setZone("Asia/Jakarta"),
                                        "days",
                                      ).days,
                                    ) >
                                      part.time_limit * 30 * 0.75 &&
                                      t("vehicle_detail.part.time"),
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </b>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl shadow-md mb-3 bg-[#E2E8F0]/25 p-4">
                    <span className="text-center h-14 flex items-center justify-center">
                      {t("vehicle_detail.part.no_vehicle_part")}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`min-h-full transition-all duration-500 z-22 absolute top-0 left-0 w-full ${
                  section === "services"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <table className="w-full text-sm border border-gray-200">
                  <thead className="bg-[#E2E8F0]/20">
                    <tr>
                      <th className="text-center py-4">
                        {t("vehicle_detail.service.table.user").toUpperCase()}
                      </th>
                      <th className="text-center py-4">
                        {t("vehicle_detail.service.table.photo").toUpperCase()}
                      </th>
                      <th className="text-center py-4">
                        {t("vehicle_detail.service.table.date").toUpperCase()}
                      </th>
                      <th className="text-center py-4">
                        {t("vehicle_detail.service.table.part").toUpperCase()}
                      </th>
                      <th className="text-center py-4">
                        {t("vehicle_detail.service.table.action").toUpperCase()}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {serviceData &&
                      serviceData.map((service) => (
                        <tr
                          key={service.id}
                          className="border-t border-gray-200"
                        >
                          <td className="py-4 text-center">
                            {service.user.name}
                          </td>
                          <td className="py-4 text-center">
                            <button
                              className="cursor-pointer text-[#00A1FE]"
                              onClick={async () => {
                                setUpdateKM({
                                  open: true,
                                  data: {
                                    id: id,
                                    name: data?.vehicle.name || "",
                                    current_mileage: Math.floor(
                                      (data?.vehicle.current_mileage || 0) /
                                        1000,
                                    ),
                                  },
                                });
                              }}
                            >
                              See Invoice
                            </button>
                          </td>
                          <td className="py-4 text-center">
                            {formatedDate(new Date(service.date), "dd/MM/yyyy")}
                          </td>
                          <td className="py-4 text-center">
                            <p>
                              {service.is_all
                                ? "All"
                                : service.parts.length + " Parts"}
                            </p>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                                onClick={() => {
                                  // setConfirmAlert({
                                  //   visible: true,
                                  //   message: t("gps_tracker.delete_confirm"),
                                  //   onConfirm: async () => {
                                  //     await handleDeletePart(part.id);
                                  //   },
                                  //   onCancel: () => {
                                  //     setConfirmAlert({
                                  //       visible: false,
                                  //       message: "",
                                  //       onConfirm: () => {},
                                  //       onCancel: () => {},
                                  //     });
                                  //   },
                                  // });
                                }}
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                                onClick={() => {
                                  // setUpdatePart({
                                  //   open: true,
                                  //   data: {
                                  //     id: part.id,
                                  //     general_vehicle_part_id:
                                  //       part.general_vehicle_part_id,
                                  //     name: part.title,
                                  //     current_distance: Math.floor(
                                  //       part.current_mileage / 1000,
                                  //     ),
                                  //     distance_limit: part.distance_limit,
                                  //     last_service: part.last_service,
                                  //     time_limit: part.time_limit,
                                  //   },
                                  // });
                                }}
                              >
                                <SquarePen className="mt-0.5" size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div
                className={`min-h-full transition-all duration-500 z-21 absolute top-0 left-0 w-full ${
                  section === "alerts"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                {data?.alert && data.alert.length > 0 ? (
                  data.alert.map((alert) => (
                    <div
                      key={alert.title}
                      className="border rounded-lg mb-3 bg-[#EF4444]/5 border-[#EF4444]/20 p-4 text-red-500"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="w-2/3 flex flex-row items-start gap-2 pr-4">
                          <div className="rounded-full bg-[#EF4444]/15 p-1 w-7 h-7 flex items-center justify-center">
                            <TriangleAlert size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-base">
                              {alert.title}
                            </p>
                            <p>{t("vehicle_detail.alert.warning")}</p>
                          </div>
                        </div>

                        <div className="w-1/3 flex justify-end">
                          <div className="text-end">
                            <p className="text-xs">
                              {t("vehicle_detail.alert.critical")}
                            </p>
                            <p className="font-semibold text-base">
                              {alert.health}% {t("vehicle_detail.alert.health")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 border-[0.1px] border-[#EF4444]/20 bg-[#EF4444]/5 rounded-lg flex flex-col gap-2">
                    <span className="text-[#64748B] text-center h-14 flex items-center justify-center">
                      {t("dashboard.no_critical_alerts")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* update km */}
        <div
          className={`z-70 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
            updateKM.open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-white shadow-lg rounded-xl w-full max-w-lg transition-transform duration-500 ${
              updateKM.open ? "scale-100" : "scale-0"
            }`}
          >
            <div className="bg-[#F8FAFC] px-6 py-6 border-b border-gray-200 rounded-t-xl">
              <div className="font-semibold flex gap-2 items-center mb-2 text-base">
                <Info size={18} color="#00A1FE" />
                {t("vehicle.modal.update_data.title")}
              </div>
              <p className="text-[#64748B]">
                {t("vehicle.modal.update_data.description")}
              </p>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle.modal.update_data.current_mileage")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={updateKM.data.current_mileage}
                    placeholder={t("vehicle.modal.update_data.current_mileage")}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdateKM({
                        ...updateKM,
                        data: {
                          ...updateKM.data,
                          current_mileage: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-12 flex flex-row justify-end gap-4">
                <button
                  onClick={() => setUpdateKM({ ...updateKM, open: false })}
                  className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  disabled={loading || !updateKM.data.current_mileage}
                  onClick={handleUpdateKM}
                  className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                    loading || !updateKM.data.current_mileage
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#048ad8] cursor-pointer"
                  }`}
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* add part */}
        <div
          className={`z-70 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
            addPart.open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-white shadow-lg rounded-xl w-full max-w-2xl transition-transform duration-500 ${
              addPart.open ? "scale-100" : "scale-0"
            }`}
          >
            <div className="bg-[#F8FAFC] px-6 py-6 border-b border-gray-200 rounded-t-xl">
              <div className="font-semibold flex gap-2 items-center mb-2 text-base">
                <Info size={18} color="#00A1FE" />
                {t("vehicle_detail.part.modal.title")}
              </div>
              <p className="text-[#64748B]">
                {t("vehicle_detail.part.modal.description")}
              </p>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.name")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="text"
                    value={addPart.data.name}
                    placeholder={t(
                      "vehicle_detail.part.modal.name_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setAddPart({
                        ...addPart,
                        data: {
                          ...addPart.data,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.distance_limit")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={addPart.data.distance_limit}
                    placeholder={t(
                      "vehicle_detail.part.modal.distance_limit_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setAddPart({
                        ...addPart,
                        data: {
                          ...addPart.data,
                          distance_limit: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.time_limit")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={addPart.data.time_limit}
                    placeholder={t(
                      "vehicle_detail.part.modal.time_limit_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setAddPart({
                        ...addPart,
                        data: {
                          ...addPart.data,
                          time_limit: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.initial_distance")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={addPart.data.current_distance}
                    placeholder={t(
                      "vehicle_detail.part.modal.initial_distance_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setAddPart({
                        ...addPart,
                        data: {
                          ...addPart.data,
                          current_distance: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.install_date")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="date"
                    value={addPart.data.last_service}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setAddPart({
                        ...addPart,
                        data: {
                          ...addPart.data,
                          last_service: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-12 flex flex-row justify-end gap-4">
                <button
                  onClick={() => setAddPart({ ...addPart, open: false })}
                  className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  disabled={
                    loading ||
                    !addPart.data.name ||
                    !addPart.data.distance_limit ||
                    !addPart.data.last_service ||
                    !addPart.data.time_limit
                  }
                  onClick={handleAddPart}
                  className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                    loading ||
                    !addPart.data.name ||
                    !addPart.data.distance_limit ||
                    !addPart.data.last_service ||
                    !addPart.data.time_limit
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#048ad8] cursor-pointer"
                  }`}
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* update part */}
        <div
          className={`z-70 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
            updatePart.open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`bg-white shadow-lg rounded-xl w-full max-w-2xl transition-transform duration-500 ${
              updatePart.open ? "scale-100" : "scale-0"
            }`}
          >
            <div className="bg-[#F8FAFC] px-6 py-6 border-b border-gray-200 rounded-t-xl">
              <div className="font-semibold flex gap-2 items-center mb-2 text-base">
                <Info size={18} color="#00A1FE" />
                {t("vehicle_detail.part.modal.title")}
              </div>
              <p className="text-[#64748B]">
                {t("vehicle_detail.part.modal.description")}
              </p>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.name")}{" "}
                    {updatePart.data.general_vehicle_part_id === null && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    autoComplete="off"
                    type="text"
                    value={updatePart.data.name}
                    placeholder={t(
                      "vehicle_detail.part.modal.name_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdatePart({
                        ...updatePart,
                        data: {
                          ...updatePart.data,
                          name: e.target.value,
                        },
                      })
                    }
                    readOnly={updatePart.data.general_vehicle_part_id !== null}
                  />
                </div>
              </div>
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.distance_limit")}{" "}
                    {updatePart.data.general_vehicle_part_id === null && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={updatePart.data.distance_limit}
                    placeholder={t(
                      "vehicle_detail.part.modal.distance_limit_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdatePart({
                        ...updatePart,
                        data: {
                          ...updatePart.data,
                          distance_limit: Number(e.target.value),
                        },
                      })
                    }
                    readOnly={updatePart.data.general_vehicle_part_id !== null}
                  />
                </div>
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.time_limit")}{" "}
                    {updatePart.data.general_vehicle_part_id === null && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={updatePart.data.time_limit}
                    placeholder={t(
                      "vehicle_detail.part.modal.time_limit_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdatePart({
                        ...updatePart,
                        data: {
                          ...updatePart.data,
                          time_limit: Number(e.target.value),
                        },
                      })
                    }
                    readOnly={updatePart.data.general_vehicle_part_id !== null}
                  />
                </div>
              </div>
              <div className="flex flex-row justify-between gap-6">
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.current_distance")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="number"
                    value={updatePart.data.current_distance}
                    placeholder={t(
                      "vehicle_detail.part.modal.current_distance_placeholder",
                    )}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdatePart({
                        ...updatePart,
                        data: {
                          ...updatePart.data,
                          current_distance: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle_detail.part.modal.last_service_date")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="date"
                    value={updatePart.data.last_service}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdatePart({
                        ...updatePart,
                        data: {
                          ...updatePart.data,
                          last_service: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-12 flex flex-row justify-end gap-4">
                <button
                  onClick={() => setUpdatePart({ ...updatePart, open: false })}
                  className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  disabled={
                    loading ||
                    !updatePart.data.name ||
                    !updatePart.data.distance_limit ||
                    !updatePart.data.last_service ||
                    !updatePart.data.time_limit
                  }
                  onClick={handleUpdatePart}
                  className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                    loading ||
                    !updatePart.data.name ||
                    !updatePart.data.distance_limit ||
                    !updatePart.data.last_service ||
                    !updatePart.data.time_limit
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#048ad8] cursor-pointer"
                  }`}
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          </div>
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
          title={t("gps_tracker.delete_confirm")}
          subtitle={t("gps_tracker.delete_warning")}
          type="delete"
          visible={confirmAlert.visible}
          onCancel={() => {
            setConfirmAlert({ ...confirmAlert, visible: false });
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
}
