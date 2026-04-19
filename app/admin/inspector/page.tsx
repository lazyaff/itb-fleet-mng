"use client";

import { ConfirmationAlert, NotificationAlert } from "@/components/Alert";
import { MultiSelect, PasswordInput, Select } from "@/components/Form";
import Pagination from "@/components/Pagination";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import {
  ChevronDown,
  Info,
  LockKeyhole,
  Plus,
  Search,
  SquarePen,
  Trash2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  admin_id: string;
  name: string;
  email: string;
  active: boolean;
  vehicles: {
    id: string;
    name: string;
    plate_number: string;
  }[];
};

export default function Inspector() {
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
  const [adminData, setAdminData] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState({
    rawData: [],
    filteredData: [],
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
  const [addData, setAddData] = useState<{
    open: boolean;
    data: {
      admin_id: string;
      name: string;
      email: string;
      password: string;
      vehicle_ids: string[];
    };
  }>({
    open: false,
    data: {
      admin_id: "",
      name: "",
      email: "",
      password: "",
      vehicle_ids: [],
    },
  });
  const [updateData, setUpdateData] = useState<{
    open: boolean;
    data: {
      id: string;
      admin_id: string;
      name: string;
      email: string;
      vehicle_ids: string[];
    };
  }>({
    open: false,
    data: {
      id: "",
      admin_id: "",
      name: "",
      email: "",
      vehicle_ids: [],
    },
  });
  const [changePassword, setChangePassword] = useState<{
    open: boolean;
    data: {
      id: string;
      password: string;
      confirm_password: string;
    };
  }>({
    open: false,
    data: {
      id: "",
      password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    setPageInfo({
      title: "Admin",
      subtitle: "User Inspection",
    });
  }, []);

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
        `/api/v1/inspector?page=${pagination.page}&search=${searchInput}&size=20`,
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

  const fetchVehicleData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/inspector/vehicle-list?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) {
        setAvailableVehicles({
          rawData: result.data,
          filteredData: result.data,
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

  const handleAddData = async () => {
    try {
      const { admin_id, name, email, password, vehicle_ids } = addData.data;
      if (!admin_id || !name || !email || !password || loading) {
        return;
      }

      setAddData({ ...addData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/inspector`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id,
          name,
          email,
          password,
          vehicle_ids,
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
      const { id, name, email, admin_id, vehicle_ids } = updateData.data;
      if (!id || !name || !email || !admin_id || loading) {
        return;
      }

      setUpdateData({ ...updateData, open: false });
      setLoading(true);

      const response = await fetch(`/api/v1/inspector`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          email,
          admin_id,
          vehicle_ids,
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

      const response = await fetch(`/api/v1/inspector`, {
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
        title: "Failed",
        subtitle: "Oops! Something went wrong, please try again later.",
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

      const response = await fetch(`/api/v1/inspector/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: id,
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
        title: "Failed",
        subtitle: "Oops! Something went wrong, please try again later.",
        onClose: () => {},
      });
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { id, password, confirm_password } = changePassword.data;
      if (!id || !password || !confirm_password || loading) {
        return;
      }

      setLoading(true);

      const response = await fetch(`/api/v1/inspector/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: id,
          password,
          confirm_password,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAlert({
          visible: true,
          type: "success",
          title: "Successful",
          subtitle: "Congratulations! The password has been changed.",
          onClose: () => {},
        });
        setLoading(false);
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
              setChangePassword({
                ...changePassword,
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
          setChangePassword({
            ...changePassword,
            open: true,
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
                admin_id: "",
                name: "",
                email: "",
                password: "",
                vehicle_ids: [],
              },
            });
          }}
        >
          <Plus size={20} /> <span>Add Inspector</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
        <table className="w-full">
          <thead className="bg-[#E2E8F0]/20">
            <tr className="border-b border-gray-300">
              <th className="px-6 py-3 text-center">NO.</th>
              <th className="px-6 py-3 text-center">INSPECTOR</th>
              <th className="px-6 py-3 text-center">VEHICLES</th>
              <th className="px-6 py-3 text-center">EMAIL</th>
              <th className="px-6 py-3 text-center">STATUS</th>
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
                  {item.name}
                </td>

                <VehicleCell item={item} />

                <td className="px-6 py-3 text-gray-800 text-center">
                  {item.email}
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
                          message: "Are you sure you want to delete this item?",
                          subtitle: "This action cannot be undone.",
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
                        await fetchVehicleData(item.id || "");
                        setUpdateData({
                          open: true,
                          data: {
                            id: item.id,
                            admin_id: item.admin_id,
                            name: item.name,
                            email: item.email,
                            vehicle_ids: item.vehicles.map((v) => v.id),
                          },
                        });
                      }}
                    >
                      <SquarePen size={18} />
                    </button>
                    <button
                      className="cursor-pointer text-gray-600 hover:text-emerald-500"
                      onClick={() => {
                        setChangePassword({
                          open: true,
                          data: {
                            id: item.id,
                            password: "",
                            confirm_password: "",
                          },
                        });
                      }}
                    >
                      <LockKeyhole size={18} />
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
        className={`z-50 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
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
              Add New Inspector
            </div>
            <p className="text-[#64748B]">Add a new Inspector to the system</p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              <Select
                label="Admin Responsible"
                data={adminData}
                value={addData.data.admin_id}
                onChange={(val) => {
                  setAddData({
                    ...addData,
                    data: {
                      ...addData.data,
                      admin_id: val,
                    },
                  });
                }}
                displayValue={(item: any) => `${item.name}`}
                searchKeys={["name"]}
                required={true}
              />
              <div className="w-full">
                <label className="block mb-2">
                  Inspector Name <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  placeholder="Enter Inspector Name"
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="email"
                  placeholder="Enter Email"
                  value={addData.data.email}
                  onChange={(e) =>
                    setAddData({
                      ...addData,
                      data: { ...addData.data, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <PasswordInput
                label="Password"
                required
                placeholder="Enter Password"
                value={addData.data.password}
                onChange={(val) =>
                  setAddData({
                    ...addData,
                    data: {
                      ...addData.data,
                      password: val,
                    },
                  })
                }
              />
            </div>
            <div className="flex flex-row justify-between pr-3 w-1/2">
              <MultiSelect
                label="Vehicle"
                data={availableVehicles.filteredData}
                value={addData.data.vehicle_ids}
                onChange={(val) =>
                  setAddData({
                    ...addData,
                    data: { ...addData.data, vehicle_ids: val },
                  })
                }
                displayValue={(item: any) =>
                  `${item.plate_number} - ${item.name}`
                }
                searchKeys={["plate_number", "name"]}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-32 flex flex-row justify-end gap-4">
              <button
                onClick={() => setAddData({ ...addData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={
                  !addData.data.admin_id ||
                  !addData.data.email ||
                  !addData.data.password ||
                  !addData.data.name
                }
                onClick={handleAddData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  !addData.data.admin_id ||
                  !addData.data.email ||
                  !addData.data.password ||
                  !addData.data.name
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
        className={`z-50 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
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
              Update Inspector
            </div>
            <p className="text-[#64748B]">
              Modify the details of an existing inspector data.
            </p>
          </div>
          <div className="space-y-6 px-6 py-6">
            <div className="flex flex-row justify-between gap-6">
              <Select
                label="Admin Responsible"
                data={adminData}
                value={updateData.data.admin_id}
                onChange={(val) => {
                  setUpdateData({
                    ...updateData,
                    data: {
                      ...updateData.data,
                      admin_id: val,
                    },
                  });
                }}
                displayValue={(item: any) => `${item.name}`}
                searchKeys={["name"]}
                required={true}
              />
              <div className="w-full">
                <label className="block mb-2">
                  Inspector Name <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  placeholder="Enter Inspector Name"
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  autoComplete="off"
                  type="email"
                  placeholder="Enter Email"
                  value={updateData.data.email}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      data: { ...updateData.data, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <MultiSelect
                label="Vehicle"
                data={availableVehicles.filteredData}
                value={updateData.data.vehicle_ids}
                onChange={(val) =>
                  setUpdateData({
                    ...updateData,
                    data: { ...updateData.data, vehicle_ids: val },
                  })
                }
                displayValue={(item: any) =>
                  `${item.plate_number} - ${item.name}`
                }
                searchKeys={["plate_number", "name"]}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-32 flex flex-row justify-end gap-4">
              <button
                onClick={() => setUpdateData({ ...updateData, open: false })}
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={
                  !updateData.data.admin_id ||
                  !updateData.data.email ||
                  !updateData.data.name
                }
                onClick={handleUpdateData}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  !updateData.data.admin_id ||
                  !updateData.data.email ||
                  !updateData.data.name
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

      {/* change password modal */}
      <div
        className={`z-50 fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
          changePassword.open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`bg-white shadow-lg rounded-xl w-full max-w-lg transition-transform duration-500 py-6 px-10 ${
            changePassword.open ? "scale-100" : "scale-0"
          }`}
        >
          <div className="flex flex-col items-center justify-center px-10 py-3 text-center">
            <div className="flex justify-center items-center bg-[#D9D9D9] rounded-full w-14 h-14 mx-auto">
              <LockKeyhole className="w-7 h-7 text-white" />
            </div>
            <p className="mt-4 text-gray-600 font-bold text-lg">
              Set a new password
            </p>
            <p className="text-[#64748B] ">
              Create a new password. Ensure it differs from previous ones for
              security
            </p>
          </div>

          <div className="space-y-6 px-6 py-4">
            <PasswordInput
              label="Password"
              required
              placeholder="Enter the new password"
              value={changePassword.data.password}
              onChange={(val) =>
                setChangePassword({
                  ...changePassword,
                  data: {
                    ...changePassword.data,
                    password: val,
                  },
                })
              }
            />
            <PasswordInput
              label="Confirm Password"
              required
              placeholder="Re-enter password"
              value={changePassword.data.confirm_password}
              onChange={(val) =>
                setChangePassword({
                  ...changePassword,
                  data: {
                    ...changePassword.data,
                    confirm_password: val,
                  },
                })
              }
            />

            {/* Action Buttons */}
            <div className="w-full pt-6 flex flex-row justify-center gap-6">
              <button
                onClick={() =>
                  setChangePassword({ ...changePassword, open: false })
                }
                className="font-semibold px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={
                  !changePassword.data.password ||
                  !changePassword.data.confirm_password
                }
                onClick={() => {
                  setChangePassword({ ...changePassword, open: false });
                  setTimeout(() => {
                    setConfirmAlert({
                      visible: true,
                      message: "Are you sure you want to change the password?",
                      subtitle: "",
                      type: "password",
                      onConfirm: async () => {
                        await handleChangePassword();
                      },
                      onCancel: () => {
                        setChangePassword({ ...changePassword, open: true });
                      },
                    });
                  }, 300);
                }}
                className={`font-semibold px-12 bg-[#00A1FE] text-white py-2 rounded-lg select-none ${
                  !changePassword.data.password ||
                  !changePassword.data.confirm_password
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#048ad8] cursor-pointer"
                }`}
              >
                Update
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

function VehicleCell({ item }: any) {
  const [expandedVehicles, setExpandedVehicles] = useState<
    Record<string, boolean>
  >({});

  const isExpanded = expandedVehicles[item.id] || false;

  const toggleExpand = () => {
    setExpandedVehicles((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
  };

  const vehicles = item.vehicles || [];
  const visibleVehicles = isExpanded ? vehicles : vehicles.slice(0, 1);
  const remainingCount = vehicles.length - 1;

  return (
    <td className="px-6 py-3 text-gray-800 text-center">
      <div
        className={`flex flex-row justify-center ${!isExpanded ? "items-center" : "items-start"} gap-8`}
      >
        {/* list vehicle */}
        <div
          className={`grid ${isExpanded ? "grid-cols-2 gap-4" : "grid-cols-1"}`}
        >
          {visibleVehicles.map((vehicle: any) => (
            <div className="flex flex-col text-left" key={vehicle.id}>
              <span className="text-gray-800 text-sm">
                {vehicle.plate_number}
              </span>
              <span className="text-xs text-gray-400">{vehicle.name}</span>
            </div>
          ))}
        </div>

        {vehicles.length > 1 && (
          <button
            onClick={toggleExpand}
            className="flex items-center gap-2 text-[0.6rem] text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {!isExpanded && (
              <span className="bg-gray-200 px-2 py-0.5 rounded-xl">
                +{remainingCount} more
              </span>
            )}
            <span
              className={`transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <ChevronDown color="black" size={20} />
            </span>
          </button>
        )}
      </div>
    </td>
  );
}
