"use client";

import { FilterButtonGroup, Select } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { approvalStatus, approvalType, syncStatus } from "@/src/dropdown";
import { Eye, Search, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  type: string;
  description_id: string;
  description_en: string;
  status: string;
  requested_at: string;
};

type DetailProps = {
  type: string;
  requester: string;
  request_date: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  service_history: {
    image: string;
    vehicle_name: string;
    plate_number: string;
    service_date: string;
    mileage: number;
    cost: number;
    notes: string | null;
    parts: {
      id: string;
      name: string;
    }[];
  } | null;
  vehicle_sync:
    | {
        plate_number: string;
        name: string;
        status: string;
      }[]
    | null;
};

export default function MyRequest() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [filteredData, setFilteredData] = useState<DataProps[]>([]);
  const [detailData, setDetailData] = useState<DetailProps | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.reports"),
      subtitle: t("sidebar.my_request"),
    });
  }, [lang]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [pagination.page, searchInput, status, type]);

  // lock body scroll while the detail panel is open
  useEffect(() => {
    document.body.style.overflow = openDetail ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openDetail]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setTimeout(() => {
      setDetailData(null);
    }, 400);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/my-request?page=${pagination.page}&search=${searchInput}&size=10&type=${type}&status=${status}`,
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

  const fetchDetailData = async (id: string) => {
    try {
      if (loading) return;
      setLoading(true);
      const response = await fetch(`/api/v1/my-request/detail?id=${id}`, {
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchInput(e.currentTarget.value);
                    setPagination({ ...pagination, page: 1 });
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-end justify-between w-full gap-2">
            <div className="flex items-center gap-5">
              <FilterButtonGroup
                items={Object.entries(approvalStatus)}
                value={status}
                onChange={setStatus}
                allLabel={lang === "id" ? "Semua" : "All"}
                getValue={([key]) => key}
                getLabel={([, item]) =>
                  lang === "id" ? item.label_id : item.label_en
                }
              />

              <div className="h-10 w-px bg-gray-300" />

              <FilterButtonGroup
                items={approvalType}
                value={type}
                onChange={setType}
                allLabel={lang === "id" ? "Semua" : "All"}
                getValue={(item) => item.id}
                getLabel={(item) =>
                  lang === "id" ? item.label_id : item.label_en
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
          <table className="w-full">
            <thead className="bg-[#E2E8F0]/20">
              <tr className="border-b border-gray-300">
                <th className="px-6 py-3 text-center">
                  {t("my_request.table.type").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("my_request.table.description").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("my_request.table.requested").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">STATUS</th>
                <th className="px-6 py-3 text-center">
                  {t("my_request.table.action").toUpperCase()}
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className={`border-b border-gray-300`}>
                  <td className="px-6 py-3 text-gray-800 text-center font-semibold">
                    {
                      approvalType.find((type) => type.id === item.type)?.[
                        lang === "id" ? "long_label_id" : "long_label_en"
                      ]
                    }
                  </td>

                  <td className="px-6 py-3 text-gray-800 text-center">
                    {lang === "id" ? item.description_id : item.description_en}
                  </td>

                  <td className="px-6 py-3 text-gray-800 text-center">
                    {item.requested_at}
                  </td>

                  <td className="px-6 py-3 text-center">
                    {(() => {
                      const config =
                        approvalStatus[
                          item.status as keyof typeof approvalStatus
                        ];

                      if (!config) return item.status;

                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-sm font-medium ${config.bg} ${config.text} ${config.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          {lang === "id" ? config.label_id : config.label_en}
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
                          setOpenDetail(true);
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

      {/* Overlay */}
      <div
        className={`fixed inset-0 left-64 bg-black/40 z-40 transition-opacity duration-300 ${
          openDetail
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={handleCloseDetail}
      />

      {/* Detail Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#F6F8FA] z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          openDetail ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {detailData && (
          <div className="flex flex-col pt-14 bg-[#F6F8FA]">
            <div className="flex-1 p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 uppercase mb-1">
                    {t("approval_inbox.table.type")}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {
                      approvalType.find((tp) => tp.id === detailData.type)?.[
                        lang === "id" ? "long_label_id" : "long_label_en"
                      ]
                    }
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 uppercase mb-1">
                    {t("approval_inbox.requester")}
                  </p>
                  <p className="font-semibold text-gray-800 wrap-break-word">
                    {detailData.requester}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 uppercase mb-1">
                    {t("approval_inbox.requested_date")}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {detailData.request_date}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 uppercase mb-1">STATUS</p>
                  {(() => {
                    const config =
                      approvalStatus[
                        detailData.status as keyof typeof approvalStatus
                      ];
                    if (!config) return detailData.status;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-sm font-medium ${config.bg} ${config.text} ${config.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        />
                        {lang === "id" ? config.label_id : config.label_en}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {detailData.rejection_reason && (
                <div className="bg-white rounded-lg py-3 border border-gray-200">
                  <p className="text-xs text-gray-800 font-semibold mb-1 px-3 ">
                    {t("approval_inbox.rejection_reason")}
                  </p>
                  <div className="border border-gray-200 rounded-lg p-2.5 min-h-20 mt-2 mx-3">
                    <p className="text-gray-800">
                      {detailData.rejection_reason}
                    </p>
                  </div>
                </div>
              )}

              {detailData.service_history && (
                <div className="space-y-4">
                  {detailData.service_history.image && (
                    <img
                      src={detailData.service_history.image}
                      alt={detailData.service_history.vehicle_name}
                      className="w-full h-auto object-cover rounded-lg border border-gray-200"
                    />
                  )}

                  <div className="divide-y divide-gray-100 border border-gray-200 bg-white rounded-lg">
                    <DetailRow
                      label={t("approval_inbox.vehicle")}
                      value={detailData.service_history.vehicle_name}
                    />
                    <DetailRow
                      label={t("approval_inbox.plate")}
                      value={detailData.service_history.plate_number}
                    />
                    <DetailRow
                      label={t("approval_inbox.service_date")}
                      value={detailData.service_history.service_date}
                    />
                    <DetailRow
                      label={t("approval_inbox.mileage")}
                      value={`${detailData.service_history.mileage.toLocaleString("id-ID")} km`}
                    />
                    <DetailRow
                      label={t("approval_inbox.price")}
                      value={`Rp ${detailData.service_history.cost.toLocaleString("id-ID")}`}
                    />
                    <div className="px-4 py-2.5">
                      <p className="text-xs text-gray-400 uppercase mb-2">
                        {t("approval_inbox.serviced_parts")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detailData.service_history.parts.map((part) => (
                          <span
                            key={part.id}
                            className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200"
                          >
                            {part.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {detailData.service_history.notes && (
                      <div className="px-4 py-2.5">
                        <p className="text-xs text-gray-400 uppercase mb-2">
                          {t("approval_inbox.notes")}
                        </p>
                        <p className="text-gray-700 text-sm">
                          {detailData.service_history.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle sync detail */}
              {detailData.vehicle_sync && (
                <div className="">
                  <h2 className="text-[#7B7B7B]/80 font-bold text-lg uppercase">
                    {t("my_request.vehicle_for_sync")} (
                    {detailData.vehicle_sync.length})
                  </h2>
                  <div className="border border-gray-200 bg-white rounded-lg mt-3">
                    {detailData.vehicle_sync.map((vehicle) => (
                      <div
                        key={vehicle.plate_number}
                        className="border-b border-gray-200 p-4"
                      >
                        <p className="font-semibold">{vehicle.name}</p>
                        <div className="mt-3 text-[0.825rem]">
                          <span className="bg-[#F8FAFC] py-1 px-2 border border-gray-200 rounded-md mr-2">
                            {vehicle.plate_number}
                          </span>
                          {(() => {
                            const config =
                              syncStatus[
                                vehicle.status as keyof typeof syncStatus
                              ];

                            if (!config) return vehicle.status;

                            return (
                              <span
                                className={`py-1 px-2 border font-medium ${config.bg} ${config.text} ${config.border} rounded-md`}
                              >
                                {t(`my_request.${vehicle.status}`)}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
