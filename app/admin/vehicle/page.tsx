"use client";

import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import {
  CircleCheck,
  ClipboardX,
  Eye,
  Info,
  Search,
  SquarePen,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { useLanguage } from "@/context/Language";
import { Select } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import {
  vehicle_health,
  vehicle_status,
  vehicle_status_color,
} from "@/src/dropdown";
import { DateTime } from "luxon";
import { NotificationAlert } from "@/components/Alert";
import { SelectForm } from "@/components/Form";

type DataProps = {
  alert: {
    vehicle_id: string;
    title: string;
    plate_number: string;
  }[];
  vehicle: VehicleProps[];
};

type VehicleProps = {
  id: string;
  plate_number: string;
  name: string;
  image: string;
  status: string;
  health: number;
  current_mileage: number;
  next_service: {
    time_limit: number;
    distance_limit: number;
  };
  updated: boolean;
};

export default function Vehicle() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { setPageInfo } = useContext(PageInfoContext);
  const router = useRouter();
  const [data, setData] = useState<DataProps>();
  const [filteredData, setFilteredData] = useState<VehicleProps[]>([]);
  const [filteredVehicle, setFilteredVehicle] = useState<VehicleProps[]>([]);
  const [vehicleHealth, setVehicleHealth] = useState({
    healthy: 0,
    near_service: 0,
    overdue: 0,
  });
  const [pagination, setPagination] = useState({
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
  const [updateStatus, setUpdateStatus] = useState<{
    open: boolean;
    data: {
      id: string;
      plate_number: string;
      status: string;
    };
  }>({
    open: false,
    data: {
      id: "",
      plate_number: "",
      status: "",
    },
  });
  const [updateData, setUpdateData] = useState<{
    open: boolean;
    type: "add" | "update";
    data: {
      id: string;
      plate_number: string;
      name: string;
      current_mileage: number;
      last_service: string;
    };
  }>({
    open: false,
    type: "add",
    data: {
      id: "",
      plate_number: "",
      name: "",
      current_mileage: 0,
      last_service: "",
    },
  });
  const [searchInput, setSearchInput] = useState("");
  const [availability, setAvailability] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [sort, setSort] = useState("");
  const { t, lang } = useLanguage();
  const PAGE_SIZE = 10;

  const availabilityData = [
    {
      id: "",
      name: t("common.all"),
    },
    ...vehicle_status.map((item) => ({
      id: item["en"],
      name: item[lang],
    })),
  ];

  const healthStatusData = [
    {
      id: "",
      name: t("common.all"),
    },
    ...vehicle_health.map((item) => ({
      id: item[lang],
      name: item[lang],
    })),
  ];

  const sortOptions = [
    {
      id: "health_desc",
      name: t("vehicle.sort.health_desc"),
    },
    {
      id: "health_asc",
      name: t("vehicle.sort.health_asc"),
    },
    {
      id: "vehicle_asc",
      name: t("vehicle.sort.vehicle_asc"),
    },
    {
      id: "vehicle_desc",
      name: t("vehicle.sort.vehicle_desc"),
    },
  ];

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.vehicle_list"),
      subtitle: t("sidebar.vehicle_list"),
    });
  }, [lang]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v1/vehicle", {
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
      const healthData = response.data.vehicle.reduce(
        (acc: any, item: any) => {
          if (item.health > 50) {
            acc.healthy += 1;
          } else if (item.health >= 25) {
            acc.near_service += 1;
          } else {
            acc.overdue += 1;
          }
          return acc;
        },
        { healthy: 0, near_service: 0, overdue: 0 },
      );
      setVehicleHealth(healthData);
      setPagination({
        page: 1,
        totalPages: Math.ceil(response.data.vehicle.length / PAGE_SIZE),
        totalRecords: response.data.vehicle.length,
      });
      const start = 0;
      const end = PAGE_SIZE;

      setFilteredData(response.data.vehicle.slice(start, end));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && !data) {
      fetchData();
    }
  }, [session]);

  const applyFilter = () => {
    if (!data?.vehicle) return;

    let result = [...data.vehicle];

    if (searchInput) {
      const keyword = searchInput.toLowerCase();
      result = result.filter(
        (item) =>
          item.plate_number.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword),
      );
    }

    if (availability) {
      result = result.filter((item) => {
        const label =
          vehicle_status.find((x) => x.en === item.status)?.[lang] ||
          item.status;

        return label === availability;
      });
    }

    if (healthStatus) {
      result = result.filter((item) => {
        const healthLabel = vehicle_health.find((x) => {
          const h = item.health;
          return h >= x.min && h <= x.max;
        })?.[lang];

        return healthLabel === healthStatus;
      });
    }

    if (sort) {
      result.sort((a, b) => {
        switch (sort) {
          case "health_desc":
            return b.health - a.health;
          case "health_asc":
            return a.health - b.health;
          case "vehicle_asc":
            return a.name.localeCompare(b.name);
          case "vehicle_desc":
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    setFilteredVehicle(result);

    setPagination({
      page: 1,
      totalPages: Math.ceil(result.length / PAGE_SIZE),
      totalRecords: result.length,
    });

    setFilteredData(result.slice(0, PAGE_SIZE));
  };

  const changePage = (page: number) => {
    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE;

    setPagination((prev) => ({
      ...prev,
      page,
    }));

    setFilteredData(filteredVehicle.slice(start, end));
  };

  useEffect(() => {
    applyFilter();
  }, [searchInput, availability, healthStatus, sort, data]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const handleUpdateStatus = async () => {
    try {
      const { id, status } = updateStatus.data;
      if (!id || !status || loading) {
        return;
      }

      setUpdateStatus({ ...updateStatus, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/vehicle/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
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
              setUpdateStatus({
                ...updateStatus,
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
          setUpdateStatus({
            ...updateStatus,
            open: true,
          });
        },
      });
      setLoading(false);
    }
  };

  const handleUpdateData = async () => {
    try {
      const { id, name, current_mileage, last_service } = updateData.data;
      if (!id || !name || current_mileage === null || loading) {
        return;
      }

      setUpdateData({ ...updateData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/vehicle`, {
        method: updateData.type === "add" ? "POST" : "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          current_mileage: current_mileage * 1000,
          last_service: last_service,
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
              setUpdateData({
                ...updateData,
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
          setUpdateData({
            ...updateData,
            open: true,
          });
        },
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div className="flex flex-row gap-4 flex-1 w-full">
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow p-5 w-64">
            <h2 className="font-semibold mb-3">{t("vehicle.fleet_status")}</h2>
            <div className="flex flex-col gap-2">
              <div>
                <div className="flex justify-between items-center gap-3">
                  <div className=" flex items-center gap-2">
                    <CircleCheck size={16} className="text-green-500 mb-0.5" />{" "}
                    {t("dashboard.healthy")}
                  </div>
                  <span className="font-semibold w-8 text-right">
                    {vehicleHealth.healthy ?? "-"}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center gap-3">
                  <div className=" flex items-center gap-2">
                    <Wrench size={16} className="text-yellow-500 mb-0.5" />{" "}
                    {t("dashboard.near_service")}
                  </div>
                  <span className="font-semibold w-8 text-right">
                    {vehicleHealth.near_service ?? "-"}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center gap-3">
                  <div className=" flex items-center gap-2">
                    <ClipboardX size={16} className="text-red-500 mb-0.5" />{" "}
                    {t("dashboard.overdue")}
                  </div>
                  <span className="font-semibold w-8 text-right text-red-500">
                    {vehicleHealth.overdue ?? "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`bg-[#f5eef0] rounded-xl shadow p-4 flex flex-col border-[0.5px] border-[#EF4444]/20 h-full`}
          >
            <h2 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
              <TriangleAlert size={15} strokeWidth={2} />{" "}
              {t("dashboard.critical_alerts")} ({data?.alert.length || 0})
            </h2>

            <div className="flex flex-col gap-2">
              {data?.alert && data?.alert.length > 0 ? (
                data?.alert.map((alert, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLoading(true);
                      router.push(
                        "/admin/vehicle/" +
                          alert.vehicle_id +
                          "?section=alerts",
                      );
                    }}
                    className="text-start p-3 border-[0.1px] border-[#EF4444]/20 bg-[#f8f8f9] rounded-lg flex flex-col gap-2 select-none cursor-pointer hover:bg-[#f8f8f9]/10"
                  >
                    <span className="font-semibold text-red-500">
                      {alert.title}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Vehicle: {alert.plate_number}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 border-[0.1px] border-[#EF4444]/20 bg-[#f8f8f9] rounded-lg flex flex-col gap-2">
                  <span className="text-[#64748B] text-center h-14 flex items-center justify-center">
                    {t("dashboard.no_critical_alerts")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - MAP */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-6 flex flex-col items-start gap-2">
            <div className="flex items-center bg-white w-80 px-3 py-2 border border-gray-200 rounded-md shadow">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder={t("inspection.search_vehicle")}
                className="w-full bg-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchInput(e.currentTarget.value);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-48">
                <Select
                  data={availabilityData}
                  value={availability}
                  onChange={(val) => {
                    setAvailability(val);
                  }}
                  displayValue={(item) => item.name}
                  searchKeys={["name"]}
                  placeholder={t("vehicle.availability")}
                  searchable={false}
                />
              </div>

              <div className="w-48">
                <Select
                  data={healthStatusData}
                  value={healthStatus}
                  onChange={(val) => {
                    setHealthStatus(val);
                  }}
                  displayValue={(item) => item.name}
                  searchKeys={["name"]}
                  placeholder={t("vehicle.health_status")}
                  searchable={false}
                />
              </div>

              <div className="w-48">
                <Select
                  data={sortOptions}
                  value={sort}
                  onChange={(val) => {
                    setSort(val);
                  }}
                  displayValue={(item) => item.name}
                  searchKeys={["name"]}
                  placeholder={t("vehicle.sort_by")}
                  searchable={false}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1 overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="min-w-max whitespace-nowrap w-full">
                <thead className="bg-[#E2E8F0]/20">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.no").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.vehicle_plate").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.status").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.health").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.current_milage").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.next_service").toUpperCase()}
                    </th>
                    <th className="px-6 py-3 text-center">
                      {t("vehicle.table.actions").toUpperCase()}
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className={`border-b border-gray-300`}>
                      <td className="px-6 py-3 text-gray-800 text-center">
                        {index + 1}
                      </td>

                      <td className="px-6 py-3 text-gray-800 text-center">
                        <div className="flex items-center justify-start gap-2">
                          <Image
                            src={item.image}
                            alt={item.plate_number}
                            width={200}
                            height={200}
                            draggable={false}
                            className="w-10 h-10 object-cover rounded-lg select-none"
                          />
                          <div className="flex flex-col justify-start items-start">
                            <span className="text-gray-800 text-sm font-semibold">
                              {item.plate_number}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3 text-center">
                        {item.updated
                          ? (() => {
                              const config =
                                vehicle_status_color[
                                  item.status as keyof typeof vehicle_status_color
                                ];

                              if (!config) return item.status;

                              return (
                                <div className="flex flex-col gap-2 justify-center items-center">
                                  <span
                                    className={`inline-flex w-fit items-center gap-1 px-1.5 rounded-md border text-sm font-medium ${config.bg} ${config.text} ${config.border}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                                    />
                                    {vehicle_status.find(
                                      (x) => x.en === item.status,
                                    )?.[lang] || item.status}
                                  </span>
                                  {session?.user?.role_id === "SADM" && (
                                    <button
                                      className="cursor-pointer text-[#00A1FE] text-xs"
                                      onClick={async () => {
                                        setUpdateStatus({
                                          open: true,
                                          data: {
                                            id: item.id,
                                            plate_number: item.plate_number,
                                            status: item.status,
                                          },
                                        });
                                      }}
                                    >
                                      {t("vehicle.change_status")}
                                    </button>
                                  )}
                                </div>
                              );
                            })()
                          : ""}
                      </td>

                      <td className="px-6 py-3 text-gray-800 text-center w-48">
                        {item.updated ? (
                          <div className="flex flex-row items-center justify-between gap-2">
                            <div className="h-2 bg-gray-200 rounded flex-1">
                              <div
                                className={`h-2 ${item.health > 50 ? "bg-[#16A249]" : item.health >= 25 ? "bg-[#FFC107]" : "bg-[#DC3545]"} rounded`}
                                style={{
                                  width: `${item.health}%`,
                                }}
                              ></div>
                            </div>
                            <span className="font-semibold w-8 text-right">
                              {item.health}%
                            </span>
                          </div>
                        ) : (
                          ""
                        )}
                      </td>

                      <td className="px-6 py-3 text-gray-800 text-center font-semibold">
                        {item.updated
                          ? `${Math.floor(item.current_mileage / 1000).toLocaleString("en-US")} km`
                          : ""}
                      </td>

                      <td className="px-6 py-3 text-center font-semibold text-gray-800">
                        {item.updated ? (
                          item.next_service.distance_limit === -1 ||
                          item.next_service.time_limit === -1 ? (
                            <div className="text-red-500 flex gap-1 items-center justify-center">
                              <TriangleAlert className="mb-0.5" size={14} />
                              <span>{t("vehicle.overdue").toUpperCase()}</span>
                            </div>
                          ) : (
                            <div>
                              <span>
                                {item.next_service.distance_limit.toLocaleString(
                                  "en-US",
                                )}{" "}
                                km
                              </span>

                              <hr className="w-[50%] mb-1.5 mt-0.5 mx-auto text-black/30" />

                              <span>
                                {DateTime.now()
                                  .plus({ days: item.next_service.time_limit })
                                  .toFormat("dd/MM/yyyy")}
                              </span>
                            </div>
                          )
                        ) : (
                          ""
                        )}
                      </td>

                      <td className="px-6 py-3 text-center align-middle">
                        {item.updated ? (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                              onClick={async () => {
                                setLoading(true);
                                router.push(`/admin/vehicle/${item.id}`);
                              }}
                            >
                              <Eye size={18} />
                            </button>

                            {session?.user?.role_id === "SADM" && (
                              <button
                                className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                                onClick={() => {
                                  setUpdateData({
                                    open: true,
                                    type: "update",
                                    data: {
                                      id: item.id,
                                      plate_number: item.plate_number,
                                      name: item.name,
                                      current_mileage: Number(
                                        (item.current_mileage / 1000).toFixed(
                                          3,
                                        ),
                                      ),
                                      last_service: "",
                                    },
                                  });
                                }}
                              >
                                <SquarePen size={18} />
                              </button>
                            )}
                          </div>
                        ) : session?.user?.role_id === "SADM" ? (
                          <button
                            className="cursor-pointer text-[#00A1FE]"
                            onClick={() => {
                              setUpdateData({
                                open: true,
                                type: "add",
                                data: {
                                  id: item.id,
                                  plate_number: item.plate_number,
                                  name: item.name,
                                  current_mileage: 0,
                                  last_service: "",
                                },
                              });
                            }}
                          >
                            + {t("vehicle.add_data")}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            {filteredData.length !== 0 && (
              <Pagination
                totalPages={pagination.totalPages}
                currentPage={pagination.page}
                onPageChange={(page) => {
                  setPagination({ ...pagination, page });
                  changePage(page);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* update status */}
      <div
        className={`z-70 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
          updateStatus.open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`bg-white shadow-lg rounded-xl w-full max-w-2xl transition-transform duration-500 ${
            updateStatus.open ? "scale-100" : "scale-0"
          }`}
        >
          <div className="bg-[#F8FAFC] px-6 py-6 border-b border-gray-200 rounded-t-xl">
            <div className="font-semibold flex gap-2 items-center mb-2 text-base">
              <Info size={18} color="#00A1FE" />
              {t("vehicle.modal.update_status.title")}
            </div>
            <p className="text-[#64748B]">
              {t("vehicle.modal.update_status.description")}
            </p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle.modal.update_status.plate_number")}
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  value={updateStatus.data.plate_number}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  readOnly
                />
              </div>
              <SelectForm
                label={t("vehicle.modal.update_status.status")}
                data={availabilityData.slice(1)}
                value={updateStatus.data.status}
                onChange={(val) => {
                  setUpdateStatus({
                    ...updateStatus,
                    data: {
                      ...updateStatus.data,
                      status: val,
                    },
                  });
                }}
                displayValue={(item: any) => `${item.name}`}
                required={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-36 flex flex-row justify-end gap-4">
              <button
                onClick={() =>
                  setUpdateStatus({ ...updateStatus, open: false })
                }
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={loading || !updateStatus.data.status}
                onClick={handleUpdateStatus}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  loading || !updateStatus.data.status
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

      {/* update data */}
      <div
        className={`z-70 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
          updateData.open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`bg-white shadow-lg rounded-xl w-full max-w-2xl transition-transform duration-500 ${
            updateData.open ? "scale-100" : "scale-0"
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
                  {t("vehicle.modal.update_data.name")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  value={updateData.data.name}
                  placeholder={t("vehicle.modal.update_data.enter_name")}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: { ...updateData.data, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle.modal.update_data.plate_number")}
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  value={updateData.data.plate_number}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  readOnly
                />
              </div>
            </div>
            <div className="flex flex-row justify-between gap-6">
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle.modal.update_data.current_mileage")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  value={updateData.data.current_mileage}
                  placeholder={t("vehicle.modal.update_data.current_mileage")}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: {
                        ...updateData.data,
                        current_mileage: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              {updateData.type === "add" && (
                <div className="w-full">
                  <label className="block mb-2">
                    {t("vehicle.modal.update_data.last_service")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoComplete="off"
                    type="date"
                    value={updateData.data.last_service}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    onChange={(e) =>
                      setUpdateData({
                        ...updateData,
                        data: {
                          ...updateData.data,
                          last_service: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-12 flex flex-row justify-end gap-4">
              <button
                onClick={() => setUpdateData({ ...updateData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={
                  loading ||
                  !updateData.data.name ||
                  !updateData.data.current_mileage ||
                  (updateData.type === "add" && !updateData.data.last_service)
                }
                onClick={handleUpdateData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  loading ||
                  !updateData.data.name ||
                  !updateData.data.current_mileage ||
                  (updateData.type === "add" && !updateData.data.last_service)
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
    </div>
  );
}
