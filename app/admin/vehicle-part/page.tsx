"use client";

import { ConfirmationAlert, NotificationAlert } from "@/components/Alert";
import { Select } from "@/components/Form";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { Info, Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  user_id: string;
  name: string;
  distance_limit: number;
  time_limit: number;
  active: boolean;
};

export default function VehicleParts() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filteredData, setFilteredData] = useState<DataProps[]>([]);
  const [adminData, setAdminData] = useState([]);

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
  const [addData, setAddData] = useState<{
    open: boolean;
    data: {
      user_id: string;
      name: string;
      distance_limit: number;
      time_limit: number;
    };
  }>({
    open: false,
    data: {
      user_id: "",
      name: "",
      distance_limit: 0,
      time_limit: 0,
    },
  });
  const [updateData, setUpdateData] = useState<{
    open: boolean;
    data: {
      id: string;
      user_id: string;
      name: string;
      distance_limit: number;
      time_limit: number;
    };
  }>({
    open: false,
    data: {
      id: "",
      user_id: "",
      name: "",
      distance_limit: 0,
      time_limit: 0,
    },
  });

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.admin"),
      subtitle: t("sidebar.vehicle_parts"),
    });
  }, [lang]);

  // Fetch data on page load and change page
  useEffect(() => {
    if (session && filteredData.length === 0) fetchData();
  }, [session]);

  useEffect(() => {
    if (session && adminData.length === 0) {
      fetchAdminData();
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [searchInput, pagination.page]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/vehicle-part?page=${pagination.page}&search=${searchInput}&size=20`,
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

  const fetchAdminData = async () => {
    try {
      const response = await fetch(`/api/v1/admin`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) {
        setAdminData(result.data.records);
      } else {
        if (result.status === 401) {
          handleLogout();
        } else {
          throw new Error("Failed to fetch data");
        }
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const handleAddData = async () => {
    try {
      const { user_id, name, distance_limit, time_limit } = addData.data;
      if (!user_id || !name || !distance_limit || !time_limit || loading) {
        return;
      }

      setAddData({ ...addData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/vehicle-part`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
          name,
          distance_limit,
          time_limit,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
        setAlert({
          visible: true,
          type: "success",
          title: t("form.success_title"),
          subtitle: t("form.add_success"),
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
              setAddData({
                ...addData,
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
          setAddData({
            ...addData,
            open: true,
          });
        },
      });
      setLoading(false);
    }
  };

  const handleUpdateData = async () => {
    try {
      const { id, user_id, name, distance_limit, time_limit } = updateData.data;
      if (
        !id ||
        !name ||
        !user_id ||
        !distance_limit ||
        !time_limit ||
        loading
      ) {
        return;
      }

      setUpdateData({ ...updateData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/vehicle-part`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          user_id,
          name,
          distance_limit,
          time_limit,
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

  const handleDeleteData = async (id: string) => {
    try {
      if (!id || loading) {
        return;
      }

      setLoading(true);

      const response = await fetch(`/api/v1/vehicle-part`, {
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

  const handleToggleStatus = async (id: string) => {
    try {
      if (!id || loading) {
        return;
      }

      setLoading(true);

      const response = await fetch(`/api/v1/vehicle-part/status`, {
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

  return (
    <div className="p-4 flex flex-col min-h-full">
      <div className="mb-4 flex flex-row items-center gap-6">
        <div className="flex items-center bg-white w-80 px-3 py-2 border border-gray-200 rounded-md shadow">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder={t("vehicle_part.search_placeholder")}
            className="w-full bg-transparent outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchInput(e.currentTarget.value);
                setPagination({ ...pagination, page: 1 });
              }
            }}
          />
        </div>
        <button
          className="bg-[#00A1FE] hover:bg-[#048ad8] text-white py-[0.6rem] px-6 rounded-md cursor-pointer select-none flex flex-row items-center gap-3"
          onClick={async () => {
            setAddData({
              open: true,
              data: {
                user_id: "",
                name: "",
                distance_limit: 0,
                time_limit: 0,
              },
            });
          }}
        >
          <Plus size={20} /> <span>{t("vehicle_part.add_part")}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
        <table className="w-full">
          <thead className="bg-[#E2E8F0]/20">
            <tr className="border-b border-gray-300">
              <th className="px-6 py-3 text-center">
                {t("vehicle_part.table.no").toUpperCase()}
              </th>
              <th className="px-6 py-3 text-center">
                {t("vehicle_part.table.part").toUpperCase()}
              </th>
              <th className="px-6 py-3 text-center">
                {t("vehicle_part.table.service_frequency_km").toUpperCase()}
              </th>
              <th className="px-6 py-3 text-center">
                {t("vehicle_part.table.service_frequency_months").toUpperCase()}
              </th>
              <th className="px-6 py-3 text-center">
                {t("vehicle_part.table.status").toUpperCase()}
              </th>
              <th className="px-6 py-3 text-center">
                {t("vehicle_part.table.actions").toUpperCase()}
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.no}
                </td>

                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.name}
                </td>

                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.distance_limit}
                </td>

                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.time_limit}
                </td>

                <td className="px-6 py-3 text-center">
                  <button
                    onClick={() => handleToggleStatus(item.id)}
                    className={`w-12 h-6 mx-auto rounded-full flex items-center transition-colors duration-300 cursor-pointer ${
                      !item.active ? "bg-gray-300" : "bg-[#00A1FE]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        !item.active
                          ? "translate-x-[0.2rem]"
                          : "translate-x-[1.6rem]"
                      }`}
                    ></span>
                  </button>
                </td>

                <td className="px-6 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="cursor-pointer text-gray-600 hover:text-red-500"
                      onClick={() => {
                        setConfirmAlert({
                          visible: true,
                          message: t("vehicle_part.delete_confirm"),
                          subtitle: t("vehicle_part.delete_warning"),
                          type: "delete",
                          onConfirm: async () => {
                            await handleDeleteData(item.id);
                          },
                          onCancel: () => {},
                        });
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      className="cursor-pointer text-gray-600 hover:text-blue-500 mt-0.5"
                      onClick={async () => {
                        setUpdateData({
                          open: true,
                          data: {
                            id: item.id,
                            user_id: item.user_id,
                            name: item.name,
                            distance_limit: item.distance_limit,
                            time_limit: item.time_limit,
                          },
                        });
                      }}
                    >
                      <SquarePen size={18} />
                    </button>
                  </div>
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
            onPageChange={(page) => setPagination({ ...pagination, page })}
          />
        )}
      </div>

      {/* add modal */}
      <div
        className={`z-70 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
          addData.open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`bg-white shadow-lg rounded-xl w-full max-w-2xl transition-transform duration-500 ${
            addData.open ? "scale-100" : "scale-0"
          }`}
        >
          <div className="bg-[#F8FAFC] px-6 py-6 border-b border-gray-200 rounded-t-xl">
            <div className="font-semibold flex gap-2 items-center mb-2 text-base">
              <Info size={18} color="#00A1FE" />
              {t("vehicle_part.modal_add_title")}
            </div>
            <p className="text-[#64748B]">
              {t("vehicle_part.modal_add_description")}
            </p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              <Select
                label={t("vehicle_part.admin_responsible")}
                data={adminData}
                value={addData.data.user_id}
                onChange={(val) => {
                  setAddData({
                    ...addData,
                    data: {
                      ...addData.data,
                      user_id: val,
                    },
                  });
                }}
                displayValue={(item: any) => `${item.name}`}
                searchKeys={["name"]}
                required={true}
              />
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_part.part_name")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  placeholder={t("vehicle_part.enter_part_name")}
                  value={addData.data.name}
                  onChange={(e) =>
                    setAddData({
                      ...addData,
                      data: { ...addData.data, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div className="flex flex-row justify-between gap-6">
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_part.service_frequency_km")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  placeholder={t("vehicle_part.enter_service_frequency_km")}
                  value={
                    addData.data.distance_limit
                      ? addData.data.distance_limit.toString()
                      : ""
                  }
                  onChange={(e) =>
                    setAddData({
                      ...addData,
                      data: {
                        ...addData.data,
                        distance_limit: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_part.service_frequency_months")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  placeholder={t("vehicle_part.enter_service_frequency_months")}
                  value={
                    addData.data.time_limit
                      ? addData.data.time_limit.toString()
                      : ""
                  }
                  onChange={(e) =>
                    setAddData({
                      ...addData,
                      data: {
                        ...addData.data,
                        time_limit: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-32 flex flex-row justify-end gap-4">
              <button
                onClick={() => setAddData({ ...addData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={
                  loading ||
                  !addData.data.user_id ||
                  !addData.data.name ||
                  !addData.data.distance_limit ||
                  !addData.data.time_limit
                }
                onClick={handleAddData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  loading ||
                  !addData.data.user_id ||
                  !addData.data.name ||
                  !addData.data.distance_limit ||
                  !addData.data.time_limit
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

      {/* update modal */}
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
              {t("vehicle_part.modal_update_title")}
            </div>
            <p className="text-[#64748B]">
              {t("vehicle_part.modal_update_description")}
            </p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              <Select
                label={t("vehicle_part.admin_responsible")}
                data={adminData}
                value={updateData.data.user_id}
                onChange={(val) => {
                  setUpdateData({
                    ...updateData,
                    data: {
                      ...updateData.data,
                      user_id: val,
                    },
                  });
                }}
                displayValue={(item: any) => `${item.name}`}
                searchKeys={["name"]}
                required={true}
              />
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_part.part_name")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  placeholder={t("vehicle_part.enter_part_name")}
                  value={updateData.data.name}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: { ...updateData.data, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div className="flex flex-row justify-between gap-6">
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_part.service_frequency_km")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  placeholder={t("vehicle_part.enter_service_frequency_km")}
                  value={
                    updateData.data.distance_limit
                      ? updateData.data.distance_limit.toString()
                      : ""
                  }
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: {
                        ...updateData.data,
                        distance_limit: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="w-full">
                <label className="block mb-2">
                  {t("vehicle_part.service_frequency_months")}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  placeholder={t("vehicle_part.enter_service_frequency_months")}
                  value={
                    updateData.data.time_limit
                      ? updateData.data.time_limit.toString()
                      : ""
                  }
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: {
                        ...updateData.data,
                        time_limit: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-32 flex flex-row justify-end gap-4">
              <button
                onClick={() => setUpdateData({ ...updateData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={
                  loading ||
                  !updateData.data.user_id ||
                  !updateData.data.name ||
                  !updateData.data.distance_limit ||
                  !updateData.data.time_limit
                }
                onClick={handleUpdateData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  loading ||
                  !updateData.data.user_id ||
                  !updateData.data.name ||
                  !updateData.data.distance_limit ||
                  !updateData.data.time_limit
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
