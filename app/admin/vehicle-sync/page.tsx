"use client";

import { DatePicker, Select } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { inspectionConclusion } from "@/src/dropdown";
import { formatedDate } from "@/utils/date";
import {
  Award,
  ClipboardCheck,
  Clock,
  Eye,
  Info,
  ListTodo,
  RefreshCw,
  Search,
  SendHorizontal,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  date: string;
  vehicle: {
    plate_number: string;
    name: string;
  };
  inspector: string;
  conclusion: string;
};

type DetailProps = {
  id: string;
  inspector: string;
  date: string;
  vehicle: {
    plate_number: string;
    name: string;
  };
  conclusion: "Siap Jalan" | "Butuh Servis" | "Dilarang Jalan";
  notes: string;
  sections: {
    title: string;
    icon: string;
    order: number;
    questions: {
      order: number;
      title: string;
      answer: {
        label: string;
        description: string;
        value: number;
      };
    }[];
  }[];
};

export default function Sync() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [vehicleIds, setVehicleIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filteredData, setFilteredData] = useState<DataProps[]>([]);
  const [detailData, setDetailData] = useState<DetailProps | null>(null);
  const [vehicleData, setVehicleData] = useState([]);
  const [openList, setOpenList] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);

  const sortOptions = [
    {
      id: "plate_desc",
      name: t("vehicle_sync.plate_desc"),
    },
    {
      id: "plate_asc",
      name: t("vehicle_sync.plate_asc"),
    },
  ];

  const statusOptions = [
    {
      id: "pending",
      name: t("vehicle_sync.status.pending"),
    },
    {
      id: "approved",
      name: t("vehicle_sync.status.approved"),
    },
    {
      id: "rejected",
      name: t("vehicle_sync.status.rejected"),
    },
    {
      id: "synced",
      name: t("vehicle_sync.status.synced"),
    },
  ];

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.admin"),
      subtitle: t("sidebar.vehicle_sync"),
    });
  }, [lang]);

  useEffect(() => {
    if (session && filteredData.length === 0) fetchData();
  }, [session]);

  useEffect(() => {
    if (session && vehicleData.length === 0) {
      fetchVehicleData();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [pagination.page, searchInput, sort, date, vehicleIds]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/inspection?page=${pagination.page}&search=${searchInput}&size=10&sort=${sort}&date=${date}&vehicle_ids=${vehicleIds}`,
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

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/inspection/vehicle-list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) {
        setVehicleData(result.data);
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

  const fetchDetailData = async (id: string) => {
    try {
      if (loading) return;
      setLoading(true);
      const response = await fetch(`/api/v1/inspection/detail?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json();
      if (result.success) {
        setDetailData(result.data);
        return true;
      } else {
        if (result.status === 401) {
          handleLogout();
          return false;
        } else {
          throw new Error("Failed to fetch data");
        }
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full max-h-none">
      <div className={`p-4 flex flex-col min-h-full`}>
        <div className="mb-6 flex flex-col items-start gap-2">
          <div className="flex flex-row w-full items-center justify-between">
            <div className="flex items-center bg-white w-80 px-3 py-2 border border-gray-200 rounded-md shadow">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder={t("vehicle_sync.search_placeholder")}
                className="w-full bg-transparent outline-none"
                //   onKeyDown={(e) => {
                //     if (e.key === "Enter") {
                //       setSearchInput(e.currentTarget.value);
                //       setPagination({ ...pagination, page: 1 });
                //     }
                //   }}
              />
            </div>
            <div className="flex flex-row justify-end gap-4 items-end">
              <button
                // onClick={() =>
                //   setUpdateService({ ...updateService, open: false })
                // }
                className="font-medium px-6 text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-200 select-none cursor-pointer items-center flex gap-4"
              >
                <RefreshCw size={14} /> {t("vehicle_sync.refresh_data")}
              </button>
              <button
                // onClick={handleUpdateService}
                className={`font-medium px-6 bg-[#00A1FE] text-white py-2 rounded-lg select-none hover:bg-[#048ad8] cursor-pointer items-center flex gap-4`}
              >
                <SendHorizontal size={14} strokeWidth={2} />{" "}
                {t("vehicle_sync.submit_request")}
              </button>
            </div>
          </div>
          <div className="flex items-end justify-between w-full gap-2">
            <div className="flex gap-2">
              <div className="w-48">
                <Select
                  data={statusOptions}
                  value={status}
                  onChange={(val) => {
                    //   setSort(val);
                    //   setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  displayValue={(item) => item.name}
                  placeholder={"Status"}
                  searchable={false}
                />
              </div>
              <div className="w-48">
                <Select
                  data={sortOptions}
                  value={sort}
                  onChange={(val) => {
                    // setSort(val);
                    // setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  displayValue={(item) => item.name}
                  searchKeys={["name"]}
                  placeholder={t("vehicle_sync.sort_by")}
                  searchable={false}
                />
              </div>
            </div>
            <div className="h-full flex items-end flex-col">
              <div className="px-3 text-gray-400 border border-gray-400 py-1.5 italic rounded-4xl bg-white select-none text-xs flex items-center gap-1">
                <Clock size={10.5} />
                <span>
                  {t("vehicle_sync.last_update")}:{" "}
                  {formatedDate(new Date(), "dd/MM/yyyy - HH:mm")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
          <table className="w-full">
            <thead className="bg-[#E2E8F0]/20">
              <tr className="border-b border-gray-300">
                <th className="px-6 py-3 text-center">
                  <input type="checkbox" className="cursor-pointer w-4 h-4" />
                </th>
                <th className="px-6 py-3 text-center">
                  {t("vehicle_sync.table.vehicle_plate").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("vehicle_sync.table.type").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">STATUS</th>
                <th className="px-6 py-3 text-center">
                  {t("vehicle_sync.table.visibility").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">DETAIL</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-300 ${item.conclusion === "Dilarang Jalan" ? "bg-[#EF4444]/5" : ""}`}
                >
                  <td className="px-6 py-3 text-gray-800 text-center">
                    <input type="checkbox" className="cursor-pointer w-4 h-4" />
                  </td>

                  <td className="px-6 py-3 text-gray-800 text-center">
                    {item.date}
                  </td>

                  <td className="px-6 py-3 text-gray-800 text-center">
                    <div>
                      <span className="text-gray-800 text-sm">
                        {item.vehicle.plate_number}
                      </span>
                      <br />
                      <span className="text-gray-600 text-xs">
                        {item.vehicle.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-3 text-gray-800 text-center">
                    {item.inspector}
                  </td>

                  <td className="px-6 py-3 text-center">
                    {(() => {
                      const config =
                        inspectionConclusion[
                          item.conclusion as keyof typeof inspectionConclusion
                        ];

                      if (!config) return item.conclusion;

                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-sm font-medium ${config.bg} ${config.text} ${config.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          {item.conclusion}
                        </span>
                      );
                    })()}
                  </td>

                  <td className="px-6 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        className="cursor-pointer text-gray-600 hover:text-[#00A1FE]"
                        onClick={async () => {
                          const detail = await fetchDetailData(item.id);
                          if (!detail) return;
                          setOpenList(false);
                          setTimeout(() => {
                            setOpenDetail(true);
                          }, 500);
                        }}
                      >
                        <Eye size={18} />
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
      </div>
    </div>
  );
}
