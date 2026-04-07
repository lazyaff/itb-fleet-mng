"use client";

import { LoadingContext } from "@/context/Loading";
import MapComponent from "@/components/Map";
import { PageInfoContext } from "@/context/PageInfo";
import { MoveDiagonal, TriangleAlert } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type dashboardData = {
  vehicle: {
    total: number;
    health: {
      healthy: number;
      near_service: number;
      overdue: number;
    };
    status: {
      in_use: number;
      available: number;
      under_maintenance: number;
    };
  };
  live_track: {
    plate_number: string;
    name: string;
    lat: number;
    long: number;
    angle: number;
    movement: boolean;
  }[];
  alert: {
    title: string;
    plate_number: string;
  }[];
};

export default function Dashboard() {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { setPageInfo } = useContext(PageInfoContext);
  const router = useRouter();
  const [data, setData] = useState<dashboardData>();

  useEffect(() => {
    setPageInfo({
      title: "Dashboard Overview",
      subtitle: "Dashboard Overview",
    });
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v1/dashboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.access_token}`,
        },
      });
      if (!res.ok) {
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

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ROW 1 - STATS */}
      <div className="flex flex-row gap-4">
        {[
          {
            title: "Total Vehicles",
            value: data?.vehicle.total || "-",
            icon: "/image/icon-cars.png",
          },
          {
            title: "Rented",
            value: data?.vehicle.status.in_use || "-",
            icon: "/image/icon-car-key.png",
          },
          {
            title: "Vehicles Available",
            value: data?.vehicle.status.available || "-",
            icon: "/image/icon-check.png",
          },
          {
            title: "Under Maintenance",
            value: data?.vehicle.status.under_maintenance || "-",
            icon: "/image/icon-tools.png",
          },
        ].map((item, i) => (
          <div
            key={i}
            className={`${i === 0 ? "w-[30%]" : "flex-1"} bg-white rounded-xl shadow p-4 flex flex-col justify-between gap-3`}
          >
            <div className="flex flex-row justify-between items-center h-8">
              <span className="font-semibold w-[70%]">{item.title}</span>
              <Image
                src={item.icon}
                width={100}
                height={100}
                alt=""
                className="w-6 h-auto"
              />
            </div>
            <span className="text-4xl font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-row gap-4 flex-1">
        <div className="flex flex-col gap-4 w-[30%]">
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold mb-3">Maintenance Health</h2>
            <div className="flex flex-col gap-2">
              <div>
                <div className="flex justify-between items-center gap-3">
                  <span className="w-24">Healthy</span>
                  <div className="h-2 bg-gray-200 rounded flex-1">
                    <div
                      className="h-2 bg-[#16A249] rounded"
                      style={{
                        width: `${data?.vehicle.health.healthy && data?.vehicle.total ? (data?.vehicle.health.healthy / data?.vehicle.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold w-8 text-right">
                    {data?.vehicle.health.healthy ?? "-"}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center gap-3">
                  <span className="w-24">Near Service</span>
                  <div className="h-2 bg-gray-200 rounded flex-1">
                    <div
                      className="h-2 bg-[#F59F0A] rounded"
                      style={{
                        width: `${data?.vehicle.health.near_service && data?.vehicle.total ? (data?.vehicle.health.near_service / data?.vehicle.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold w-8 text-right">
                    {data?.vehicle.health.near_service ?? "-"}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center gap-3">
                  <span className="w-24">Overdue</span>
                  <div className="h-2 bg-gray-200 rounded flex-1">
                    <div
                      className="h-2 bg-[#EF4444] rounded"
                      style={{
                        width: `${data?.vehicle.health.overdue && data?.vehicle.total ? (data?.vehicle.health.overdue / data?.vehicle.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold w-8 text-right ">
                    {data?.vehicle.health.overdue ?? "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`bg-[#f5eef0] rounded-xl shadow p-4 flex flex-col border-[0.5px] border-[#EF4444]/20 h-full`}
          >
            <h2 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
              <TriangleAlert size={15} strokeWidth={2} /> Critical Alerts (
              {data?.alert.length || 0})
            </h2>

            <div className="flex flex-col gap-2">
              {data?.alert && data?.alert.length > 0 ? (
                data?.alert.map((alert, i) => (
                  <div
                    key={i}
                    className="p-3 border-[0.1px] border-[#EF4444]/20 bg-[#f8f8f9] rounded-lg flex flex-col gap-2"
                  >
                    <span className="font-semibold text-red-500">
                      {alert.title}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Vehicle: {alert.plate_number}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 border-[0.1px] border-[#EF4444]/20 bg-[#f8f8f9] rounded-lg flex flex-col gap-2">
                  <span className="text-[#64748B] text-center h-14 flex items-center justify-center">
                    No Critical Alerts
                  </span>
                </div>
              )}
            </div>

            <button
              className="mt-4 bg-[#EF4444] text-white py-3 rounded-lg cursor-pointer hover:bg-[#db4444] select-none"
              onClick={() => {
                setLoading(true);
                router.push("/admin/vehicle");
              }}
            >
              View All Alerts
            </button>
          </div>
        </div>

        {/* RIGHT SIDE - MAP */}
        <div className="flex-1 bg-white rounded-xl shadow p-5 flex flex-col">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Live Fleet Preview</h2>
            <button
              className="text-[#00A1FE] flex flex-row items-center gap-2 cursor-pointer select-none hover:underline"
              onClick={() => {
                setLoading(true);
                router.push("/admin/live-track");
              }}
            >
              <span>Open Full Map</span> <MoveDiagonal size={20} />
            </button>
          </div>

          <div className="w-full flex-1 bg-gray-200 rounded">
            {data?.live_track ? (
              <MapComponent vehicles={data!.live_track!} />
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
