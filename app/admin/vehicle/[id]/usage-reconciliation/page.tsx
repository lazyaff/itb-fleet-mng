"use client";

import { Select } from "@/components/Dropdown";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { usage_reconciliation_source_color } from "@/src/dropdown";
import { formatedDate } from "@/utils/date";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useContext, useEffect, useState } from "react";

export type UsageReconciliation = {
  id: string;
  name: string;
  source: string;
  total_difference: number;
  date: string;
};

export default function UsageReconciliation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { setPageInfo } = useContext(PageInfoContext);

  const router = useRouter();
  const { t, lang } = useLanguage();

  const PAGE_SIZE = 10;

  const [usageData, setUsageData] = useState<UsageReconciliation[]>([]);

  const [filteredUsageData, setFilteredUsageData] = useState<
    UsageReconciliation[]
  >([]);

  const [paginatedUsageData, setPaginatedUsageData] = useState<
    UsageReconciliation[]
  >([]);

  const [usageDate, setUsageDate] = useState("date_desc");

  const [servicePagination, setServicePagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  const sortOptions = [
    {
      id: "date_desc",
      name: t("inspection.sort.date_desc"),
    },
    {
      id: "date_asc",
      name: t("inspection.sort.date_asc"),
    },
  ];

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.vehicle_list"),
      subtitle: t("sidebar.vehicle_list"),
    });
  }, [lang]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchUsageData = async () => {
    try {
      const response = await fetch(
        `/api/v1/vehicle/usage-reconciliation?id=${id}`,
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
        setUsageData(result.data);
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

  const applyFilter = () => {
    let result = [...usageData];

    result.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (usageDate === "date_asc") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    setFilteredUsageData(result);

    setServicePagination({
      page: 1,
      totalPages: Math.ceil(result.length / PAGE_SIZE),
      totalRecords: result.length,
    });

    setPaginatedUsageData(result.slice(0, PAGE_SIZE));
  };

  const changePage = (page: number) => {
    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE;

    setServicePagination((prev) => ({
      ...prev,
      page,
    }));

    setPaginatedUsageData(filteredUsageData.slice(start, end));
  };

  useEffect(() => {
    if (session && !usageData.length) {
      fetchUsageData();
    }
  }, [session]);

  useEffect(() => {
    applyFilter();
  }, [usageDate, usageData]);

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-[70dvh]">
      <button
        onClick={() => {
          setLoading(true);
          router.push("/admin/vehicle/" + id);
        }}
        className="bg-[#00A1FE] w-fit hover:bg-[#048ad8] text-white py-[0.6rem] px-10 rounded-md cursor-pointer select-none flex items-center gap-3"
      >
        {t("common.back")}
      </button>

      {/* MAIN CONTENT */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-full flex flex-col gap-4 h-full">
          <div className="bg-white rounded-xl shadow p-4 flex-1 overflow-auto min-h-0">
            <div className="flex justify-start items-center mb-6">
              <div className="w-40 flex justify-end">
                <Select
                  data={sortOptions}
                  value={usageDate}
                  onChange={(val) => {
                    setUsageDate(val);
                  }}
                  displayValue={(item) => item.name}
                  searchKeys={["name"]}
                  placeholder={t("inspection.sort_by")}
                  searchable={false}
                />
              </div>
            </div>

            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-[#E2E8F0]/20">
                <tr>
                  <th className="text-center py-4">NO.</th>

                  <th className="text-center py-4">
                    {t("vehicle_detail.user_usage.table.date").toUpperCase()}
                  </th>

                  <th className="text-center py-4">
                    {t("vehicle_detail.user_usage.table.renter").toUpperCase()}
                  </th>

                  <th className="text-center py-4">
                    {t("vehicle_detail.user_usage.table.type").toUpperCase()}
                  </th>

                  <th className="text-center py-4">
                    {t(
                      "vehicle_detail.user_usage.table.distance",
                    ).toUpperCase()}
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsageData.length > 0 ? (
                  paginatedUsageData.map((usage, i) => (
                    <tr key={usage.id} className="border-t border-gray-200">
                      <td className="py-4 text-center">
                        {(servicePagination.page - 1) * PAGE_SIZE + i + 1}
                      </td>

                      <td className="py-4 text-center">
                        {formatedDate(new Date(usage.date), "dd/MM/yyyy")}
                      </td>

                      <td className="py-4 text-center">{usage.name}</td>

                      <td className="py-4 text-center">
                        {(() => {
                          const config =
                            usage_reconciliation_source_color[
                              usage.source as keyof typeof usage_reconciliation_source_color
                            ];

                          if (!config) return usage.source;

                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                              />
                              {usage.source}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="font-semibold py-4 text-center">
                        {usage.total_difference > 0 && "+"}
                        {Number(usage.total_difference / 1000).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        km
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-6">
                      {t("common.no_data")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* pagination */}
            {paginatedUsageData.length !== 0 && (
              <Pagination
                totalPages={servicePagination.totalPages}
                currentPage={servicePagination.page}
                onPageChange={(page) => {
                  changePage(page);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
