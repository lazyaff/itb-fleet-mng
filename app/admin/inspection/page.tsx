"use client";

import { DatePicker, Select } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { inspectionConclusion } from "@/src/dropdown";
import { Award, Eye, Info, Search } from "lucide-react";
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

export default function Inspection() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("date_desc");
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
      id: "date_desc",
      name: t("inspection.sort.date_desc"),
    },
    {
      id: "date_asc",
      name: t("inspection.sort.date_asc"),
    },
    {
      id: "vehicle_asc",
      name: t("inspection.sort.vehicle_asc"),
    },
    {
      id: "vehicle_desc",
      name: t("inspection.sort.vehicle_desc"),
    },
  ];

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.maintenance"),
      subtitle: t("sidebar.inspection"),
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
      <div
        className={`p-4 flex flex-col min-h-full transition-all duration-500 ${
          openList
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-0 pointer-events-none"
        }`}
      >
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
                  setPagination({ ...pagination, page: 1 });
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-48">
              <DatePicker
                value={date}
                onChange={(val) => {
                  setDate(val);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder={t("common.date")}
              />
            </div>

            <div className="w-48">
              <Select
                data={vehicleData}
                value={vehicleIds}
                multiple
                onChange={(val) => {
                  setVehicleIds(val);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                displayValue={(item: any) => item.name}
                searchKeys={["name", "plate_number"]}
                placeholder={t("inspection.vehicle")}
              />
            </div>

            <div className="w-48">
              <Select
                data={sortOptions}
                value={sort}
                onChange={(val) => {
                  setSort(val);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                displayValue={(item) => item.name}
                searchKeys={["name"]}
                placeholder={t("inspection.sort_by")}
                searchable={false}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex-1">
          <table className="w-full">
            <thead className="bg-[#E2E8F0]/20">
              <tr className="border-b border-gray-300">
                <th className="px-6 py-3 text-center">
                  {t("inspection.table.no").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("inspection.table.date").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("inspection.table.vehicle_part").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("inspection.table.inspector").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("inspection.table.recommendation").toUpperCase()}
                </th>
                <th className="px-6 py-3 text-center">
                  {t("inspection.table.actions").toUpperCase()}
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
      <div
        className={`p-4 gap-4 flex flex-row justify-between min-h-full w-full transition-all duration-500 z-50 absolute top-0 left-0 ${
          openDetail
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div>
          <button className="bg-[#00A1FE] opacity-0 pointer-events-none w-40 justify-center hover:bg-[#048ad8] text-white py-[0.6rem] px-6 rounded-md cursor-pointer select-none flex flex-row items-center gap-3"></button>
        </div>
        {detailData && (
          <div className="space-y-4 w-2xl mb-4">
            <div className={`bg-white shadow-lg rounded-xl w-full max-w-2xl`}>
              <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                <div className="font-semibold flex gap-2 items-center text-base">
                  <Info strokeWidth={2.5} size={18} color="#00A1FE" />
                  {t("inspection.form_inspection_report")}
                </div>
              </div>
              <div className="space-y-6 px-6 py-6">
                <div className="flex flex-row justify-between gap-6">
                  <div className="w-full">
                    <label className="block mb-2">
                      {t("inspection.inspector")}
                    </label>
                    <input
                      readOnly
                      value={detailData.inspector}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block mb-2">{t("common.date")}</label>
                    <input
                      readOnly
                      value={detailData.date}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-row justify-between gap-6">
                  <div className="w-full">
                    <label className="block mb-2">
                      {t("inspection.vehicle_name")}
                    </label>
                    <input
                      readOnly
                      value={detailData.vehicle.name}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block mb-2">
                      {t("inspection.vehicle")}
                    </label>
                    <input
                      readOnly
                      value={detailData.vehicle.plate_number}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {detailData!.sections.map((section, sectionIndex) => (
              <div
                className={`bg-white shadow-lg rounded-xl w-full max-w-2xl`}
                key={sectionIndex}
              >
                <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                  <div className="font-semibold flex gap-2 items-center text-base">
                    <img
                      src={section.icon}
                      alt=""
                      className="w-5 h-5 object-contain mb-1"
                    />
                    Bagian {section.order}: {section.title}
                  </div>
                </div>
                <div className="">
                  {section.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-8 border-gray-300 ${idx !== section.questions.length - 1 ? "border-b" : ""}`}
                    >
                      <p className="font-semibold text-gray-800 text-sm">
                        {section.order}.{q.order} {q.title}
                      </p>

                      <p className="text-gray-600 text-sm mt-2">
                        {q.answer.label}: {q.answer.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className={`bg-white shadow-lg rounded-xl w-full max-w-2xl`}>
              <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                <div className="font-semibold flex gap-2 items-center text-base">
                  <Award
                    className="mb-2"
                    strokeWidth={2.5}
                    size={20}
                    color="#00A1FE"
                  />
                  <span>
                    {t("inspection.final_inspector_recommendation")} <br />{" "}
                    {t("inspection.assessment_conclusion")}
                  </span>
                </div>
              </div>
              <div className="space-y-6 px-12 py-6">
                {(() => {
                  const config =
                    inspectionConclusion[
                      detailData.conclusion as keyof typeof inspectionConclusion
                    ];

                  if (!config) return detailData.conclusion;

                  return (
                    <span
                      className={`inline-flex items-center detailDatas-center gap-1 px-1.5 rounded-md border text-sm font-medium ${config.bg} ${config.text} ${config.border}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                      />
                      {detailData.conclusion}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className={`bg-white shadow-lg rounded-xl w-full max-w-2xl`}>
              <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                <div className="font-semibold flex gap-2 items-center text-base">
                  <Info strokeWidth={2.5} size={18} color="#00A1FE" />
                  {t("inspection.notes")}
                </div>
              </div>
              <div className="space-y-6 px-6 py-6">
                <div className="flex flex-row justify-between gap-6">
                  <div className="w-full">
                    <textarea
                      readOnly
                      value={detailData.notes || ""}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div>
          <button
            className="bg-[#00A1FE] w-40 justify-center hover:bg-[#048ad8] text-white py-[0.6rem] px-6 rounded-md cursor-pointer select-none flex flex-row items-center gap-3"
            onClick={() => {
              setOpenDetail(false);
              setTimeout(() => {
                setOpenList(true);
                setDetailData(null);
              }, 500);
            }}
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
