"use client";

import { ConfirmationAlert, NotificationAlert } from "@/components/Alert";
import { Select } from "@/components/Form";
import Pagination from "@/components/Pagination";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { Info, Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  created_at: string;
  imei: string;
  last_update: string | null;
  vehicle: {
    id: string | null;
    name: string | null;
    plate_number: string | null;
  };
};

export default function Vehicle() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filteredData, setFilteredData] = useState<DataProps[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
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
  const [addData, setAddData] = useState({
    open: false,
    data: {
      imei: "",
      vehicle_id: "",
    },
  });
  const [updateData, setUpdateData] = useState<{
    open: boolean;
    data: {
      id: string;
      imei: string;
      vehicle_id: string | null;
    };
  }>({
    open: false,
    data: {
      id: "",
      imei: "",
      vehicle_id: "",
    },
  });

  useEffect(() => {
    setPageInfo({
      title: "Admin",
      subtitle: "GPS Tracker",
    });
  }, []);

  // Fetch data on page load and change page
  useEffect(() => {
    if (session && filteredData.length === 0) {
      fetchData();
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
        `/api/v1/gps-tracker?page=${pagination.page}&search=${searchInput}&size=20`,
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

  const fetchVehicleData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/gps-tracker/vehicle-list?id=${id}`,
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
        setAvailableVehicles(result.data);
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

  const handleAddData = async () => {
    try {
      const { imei, vehicle_id } = addData.data;
      if (!imei || loading) {
        return;
      }

      setAddData({ ...addData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/gps-tracker`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imei,
          vehicle_id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
        setAlert({
          visible: true,
          type: "success",
          title: "Successful",
          subtitle: "Congratulations! You have successfully added a new data.",
          onClose: () => {},
        });
      } else {
        if (result.status === 401) {
          handleLogout();
        } else {
          setAlert({
            visible: true,
            type: "error",
            title: "Failed",
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
        title: "Failed",
        subtitle: "Oops! Something went wrong, please try again later.",
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
      const { imei, vehicle_id } = updateData.data;
      if (!imei || loading) {
        return;
      }

      setUpdateData({ ...updateData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/gps-tracker`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: updateData.data.id,
          imei,
          vehicle_id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
        setAlert({
          visible: true,
          type: "success",
          title: "Successful",
          subtitle: "Congratulations! You have successfully updated the data.",
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
            title: "Failed",
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
        title: "Failed",
        subtitle: "Oops! Something went wrong, please try again later.",
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

      const response = await fetch(`/api/v1/gps-tracker`, {
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
          title: "Successful",
          subtitle: "Congratulations! You have successfully deleted the data.",
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
            title: "Failed",
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
        title: "Failed",
        subtitle: "Oops! Something went wrong, please try again later.",
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
    <div className="p-4 flex flex-col min-h-full">
      <div className="mb-4 flex flex-row items-center gap-6">
        <div className="flex items-center bg-white w-80 px-3 py-2 border border-gray-200 rounded-md shadow">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search plate or ID..."
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
            await fetchVehicleData("");
            setAddData({
              open: true,
              data: {
                imei: "",
                vehicle_id: "",
              },
            });
          }}
        >
          <Plus size={20} /> <span>Add GPS Tracker</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
        <table className="w-full">
          <thead className="bg-[#E2E8F0]/20">
            <tr className="border-b border-gray-300">
              <th className="px-6 py-3 text-center">NO.</th>
              <th className="px-6 py-3 text-center">DATE ADDED</th>
              <th className="px-6 py-3 text-center">IMEI NAME</th>
              <th className="px-6 py-3 text-center">LAST UPDATE</th>
              <th className="px-6 py-3 text-center">CONNECTED CAR</th>
              <th className="px-6 py-3 text-center">ACTIONS</th>
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
                  {item.created_at}
                </td>

                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.imei}
                </td>

                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.last_update || "-"}
                </td>

                <td className="px-6 py-3 text-center">
                  {item.vehicle.id ? (
                    <div className="flex flex-col">
                      <span className="text-gray-800">
                        {item.vehicle.plate_number}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.vehicle.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="italic text-gray-800">None</span>
                      <button
                        className="text-xs text-blue-500 hover:underline cursor-pointer"
                        onClick={async () => {
                          await fetchVehicleData(item.vehicle.id || "");
                          setUpdateData({
                            open: true,
                            data: {
                              id: item.id,
                              imei: item.imei,
                              vehicle_id: item.vehicle.id,
                            },
                          });
                        }}
                      >
                        Select Vehicle
                      </button>
                    </div>
                  )}
                </td>

                <td className="px-6 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="cursor-pointer text-gray-600 hover:text-red-500"
                      onClick={() => {
                        setConfirmAlert({
                          visible: true,
                          message: "Are you sure you want to delete this item?",
                          onConfirm: async () => {
                            await handleDeleteData(item.id);
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
                    <button
                      className="cursor-pointer text-gray-600 hover:text-blue-500"
                      onClick={async () => {
                        await fetchVehicleData(item.vehicle.id || "");
                        setUpdateData({
                          open: true,
                          data: {
                            id: item.id,
                            imei: item.imei,
                            vehicle_id: item.vehicle.id,
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
              Add New GPS Tracker
            </div>
            <p className="text-[#64748B]">
              Add a new GPS Tracker to the system
            </p>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              {/* IMEI */}
              <div className="w-full">
                <label className="block mb-2">
                  GPS IMEI <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  value={addData.data.imei}
                  placeholder="Enter IMEI number"
                  onChange={(e) =>
                    setAddData({
                      ...addData,
                      data: { ...addData.data, imei: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              {/* VEHICLE */}
              <Select
                label="Select Vehicle"
                data={availableVehicles}
                value={addData.data.vehicle_id}
                onChange={(val) => {
                  setAddData({
                    ...addData,
                    data: {
                      ...addData.data,
                      vehicle_id: val,
                    },
                  });
                }}
                displayValue={(item: any) =>
                  `${item.plate_number} - ${item.name}`
                }
                searchKeys={["plate_number", "name"]}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-56 flex flex-row justify-end gap-4">
              <button
                onClick={() => setAddData({ ...addData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!addData.data.imei}
                onClick={handleAddData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  !addData.data.imei
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#048ad8] cursor-pointer"
                }`}
              >
                Save
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
              Update GPS Tracker
            </div>
            <p className="text-[#64748B]">
              Modify the details of an existing GPS Tracker data.
            </p>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              {/* IMEI */}
              <div className="w-full">
                <label className="block mb-2">
                  GPS IMEI <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="number"
                  placeholder="Enter IMEI number"
                  value={updateData.data.imei}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: { ...updateData.data, imei: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              {/* VEHICLE */}
              <Select
                label="Select Vehicle"
                data={availableVehicles}
                value={updateData.data.vehicle_id}
                onChange={(val) => {
                  setUpdateData({
                    ...updateData,
                    data: {
                      ...updateData.data,
                      vehicle_id: val,
                    },
                  });
                }}
                displayValue={(item: any) =>
                  `${item.plate_number} - ${item.name}`
                }
                searchKeys={["plate_number", "name"]}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-56 flex flex-row justify-end gap-4">
              <button
                onClick={() => setUpdateData({ ...updateData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!updateData.data.imei}
                onClick={handleUpdateData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  !updateData.data.imei
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#048ad8] cursor-pointer"
                }`}
              >
                Save
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
        title="Are you sure you want to delete this item?"
        subtitle="This action cannot be undone"
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
