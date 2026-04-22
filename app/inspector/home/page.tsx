"use client";

import { LoadingContext } from "@/context/Loading";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ClipboardList,
  LogOut,
  Plus,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

type DataProps = {
  no: number;
  id: string;
  date: string;
  time: string;
  vehicle: {
    name: string | null;
    plate_number: string | null;
  };
};

export default function Home() {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const router = useRouter();
  const [sort, setSort] = useState("desc");
  const [filteredData, setFilteredData] = useState<DataProps[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const fetchData = useCallback(
    async (pageNumber = 1) => {
      try {
        if (pageNumber === 1) {
          setLoading(true);
        } else {
          setIsFetchingMore(true);
        }

        const response = await fetch(
          `/api/v1/inspection/user/history?page=${pageNumber}&sort=${sort}&size=20`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.user?.access_token}`,
            },
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!result.success) {
          if (result.status === 401) {
            handleLogout();
            return;
          }

          throw new Error("Failed to fetch");
        }

        const incoming = result.data.records || [];

        setFilteredData((prev) =>
          pageNumber === 1 ? incoming : [...prev, ...incoming],
        );

        setPagination((prev) => ({
          ...prev,
          page: pageNumber,
          totalPages: result.data.totalPages,
          totalRecords: result.data.totalRecords,
        }));
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [session, sort],
  );

  useEffect(() => {
    if (session) {
      setFilteredData([]);
      fetchData(1);
    }
  }, [session, sort]);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];

        if (
          first.isIntersecting &&
          !isFetchingMore &&
          pagination.page < pagination.totalPages
        ) {
          fetchData(pagination.page + 1);
        }
      },
      {
        threshold: 1,
      },
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [pagination, isFetchingMore, fetchData]);

  return (
    <div className="min-h-dvh bg-white pb-32 max-w-md mx-auto relative text-sm select-none">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-neutral-600 text-base">Hello!</p>
            <h1 className="text-3xl font-semibold text-neutral-900">
              {session?.user?.name}
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-[#CCD7F9] text-[#2D4583] p-3 rounded-full"
          >
            <LogOut className="rotate-180" size={22} />
          </button>
        </div>

        <div className="w-full text-center font-semibold py-2.5 rounded-2xl border-4 border-[#F4F4F4] mb-6">
          Submitted Form
        </div>
        {filteredData.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col justify-center items-center text-center px-6">
            <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
              <ClipboardList className="text-blue-300" size={42} />
            </div>

            <h3 className="font-semibold text-xl text-neutral-800 mb-1.5">
              Nothing here. For now.
            </h3>

            <p className="text-neutral-500">
              This is where you'll find your <br /> finished form.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[90px_1fr_auto] gap-3 text-neutral-400 mb-3 px-2 items-center">
              <span className="text-center pl-4">Time</span>
              <span>Vehicles</span>
              <button
                className="ml-auto"
                onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
              >
                {sort === "desc" ? (
                  <ArrowDownNarrowWide />
                ) : (
                  <ArrowUpNarrowWide />
                )}
              </button>
            </div>
            <div className="">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[90px_1fr] gap-3 items-start"
                >
                  <div className="text-right pr-3 border-r border-neutral-200 h-full py-4">
                    <div className="font-medium text-neutral-700">
                      {item.date}
                    </div>
                    <div className="text-neutral-400">{item.time}</div>
                  </div>
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        setLoading(true);
                        router.push(`/inspection/detail/${item.id}`);
                      }, 200);
                    }}
                    className="w-full mt-4 bg-[#F7F7F7] rounded-2xl p-5 text-left hover:bg-[#efefef] transition active:scale-90 duration-200"
                  >
                    <div className="font-bold text-lg text-neutral-800 mb-1">
                      {item.vehicle.plate_number}
                    </div>
                    <div className="text-neutral-600">{item.vehicle.name}</div>
                  </button>
                </div>
              ))}
            </div>
            <div
              ref={loaderRef}
              className="h-16 flex justify-center items-center text-sm text-neutral-400"
            >
              {isFetchingMore && "Loading more..."}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => {
            setTimeout(() => {
              setLoading(true);
              router.push("/inspection/report");
            }, 200);
          }}
          className="w-14 h-14 rounded-full bg-[#00A1FE]   shadow-xl flex items-center justify-center transition active:scale-90 duration-200"
        >
          <Plus size={36} className="text-white" />
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#F3F3F5] rounded-t-3xl" />
    </div>
  );
}
