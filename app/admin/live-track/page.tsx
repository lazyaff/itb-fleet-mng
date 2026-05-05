"use client";

import { InteractiveMapComponent, MapRef } from "@/components/Map";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { vehicle_gps_status_color } from "@/src/dropdown";
import { formatedDate } from "@/utils/date";
import {
  Calendar,
  CircleGauge,
  Clock,
  Phone,
  Search,
  Timer,
  TrendingUp,
  Van,
  X,
  Zap,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";

type VehicleUsage = {
  name: string | null;
  phone: string | null;
  image: string;
  end_date: string | null;
};

type VehicleStatus = "Moving" | "Stopped" | "No GPS";

type Vehicle = {
  id: string;
  image: string;
  plate_number: string;
  name: string;
  current_mileage: number;
  status: VehicleStatus;
  speed: number | null;
  battery_voltage: number | null;
  last_updated: string | null;
  lat: number | null;
  long: number | null;
  angle: number | null;
  gsm_signal_strength: number | null;
  movement: boolean | null;
  usage: VehicleUsage;
};

export default function LiveTrack() {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { setPageInfo } = useContext(PageInfoContext);
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const [rawVehicleData, setRawVehicleData] = useState<Vehicle[]>([]);
  const [filteredVehicle, setFilteredVehicle] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState("");
  const { t, lang } = useLanguage();

  const vehicleStatusOption = [
    { id: "", name: t("live_track.all"), color: "blue" },
    { id: "Moving", name: t("live_track.moving"), color: "green" },
    { id: "Stopped", name: t("live_track.stopped"), color: "gray" },
    { id: "No GPS", name: t("live_track.no_gps"), color: "red" },
  ];

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.live_fleet_map"),
      subtitle: t("sidebar.real_time_map"),
    });
  }, [lang]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v1/live-track", {
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
      setRawVehicleData(response.data || []);
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const applyFilter = () => {
    let result = [...rawVehicleData];

    if (searchInput) {
      const keyword = searchInput.toLowerCase();
      result = result.filter(
        (item) =>
          item.plate_number.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword),
      );
    }

    if (vehicleStatus) {
      result = result.filter((item) => item.status === vehicleStatus);
    }

    setFilteredVehicle(result);
  };

  useEffect(() => {
    applyFilter();
  }, [searchInput, vehicleStatus, rawVehicleData]);

  return (
    <div className="relative h-full w-full max-h-full max-w-full">
      <div className="absolute left-4 top-4 bottom-4 z-401 flex flex-row items-end gap-4">
        {activeVehicle ? (
          <div className="bg-[rgb(249,250,251)] w-88 rounded-xl flex flex-col items-start gap-4 p-4">
            <div className="flex flex-row justify-between items-start w-full">
              <div className="w-[80%] flex items-center gap-2">
                <Image
                  src={activeVehicle.image}
                  alt={activeVehicle.id}
                  width={200}
                  height={200}
                  draggable={false}
                  className="w-10 h-10 object-cover rounded-lg select-none"
                />
                <div className="flex flex-col justify-start items-start">
                  <span className="text-gray-800 text-sm">
                    {activeVehicle.name}
                  </span>
                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <span className="inline-flex items-center px-1.5 rounded-md border text-xs font-medium bg-gray-100 text-black border-black">
                      {activeVehicle.plate_number}
                    </span>

                    {(() => {
                      const config =
                        vehicle_gps_status_color[
                          activeVehicle.status as keyof typeof vehicle_gps_status_color
                        ];

                      if (!config) return activeVehicle.status;

                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 rounded-md border text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          {
                            vehicleStatusOption.find(
                              (item) => item.id === activeVehicle.status,
                            )?.name
                          }
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <button
                className="cursor-pointer p-1 pr-0"
                onClick={() => {
                  setActiveVehicle(null);
                }}
              >
                <X size={18} color="gray" />
              </button>
            </div>
            {activeVehicle.usage.name && (
              <div className="border-t border-gray-200 w-full pt-4 gap-2 flex flex-col">
                <div className="w-[80%] flex items-center gap-2">
                  <Image
                    src={activeVehicle.usage.image}
                    alt={activeVehicle.id}
                    width={200}
                    height={200}
                    draggable={false}
                    className="w-8 h-8 object-cover rounded-full select-none"
                  />
                  <p>{activeVehicle.usage.name}</p>
                </div>
                <div className="flex w-full justify-between">
                  <p className="text-gray-500">
                    <Phone className="inline mr-1 mb-0.5" size={14} />{" "}
                    {t("live_track.phone_number")}
                  </p>
                  <p>{activeVehicle.usage.phone}</p>
                </div>
                <div className="flex w-full justify-between">
                  <p className="text-gray-500">
                    <Calendar className="inline mr-1 mb-1" size={14} />{" "}
                    {t("live_track.due_date")}
                  </p>
                  <p>{activeVehicle.usage.end_date}</p>
                </div>
              </div>
            )}
            <div className="border-t border-gray-200 w-full pt-4 gap-4 flex flex-col">
              <div>
                <div className="flex justify-between text-gray-500">
                  <p>{t("live_track.gsm_signal")}</p>
                  <p>
                    {activeVehicle.gsm_signal_strength
                      ? (Math.min(activeVehicle.gsm_signal_strength, 5) / 5) *
                        100
                      : 0}
                    %
                  </p>
                </div>
                <div className="h-2 bg-gray-200 rounded mt-2">
                  <div
                    className={`h-2 ${activeVehicle.gsm_signal_strength && activeVehicle.gsm_signal_strength >= 3 ? "bg-[#16A249]" : activeVehicle.gsm_signal_strength && activeVehicle.gsm_signal_strength >= 2 ? "bg-[#FFC107]" : "bg-[#DC3545]"} rounded`}
                    style={{
                      width: `${activeVehicle.gsm_signal_strength ? (Math.min(activeVehicle.gsm_signal_strength, 5) / 5) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`bg-white border border-gray-300 rounded-lg py-2.5 px-3 flex flex-col gap-2 justify-between`}
                >
                  <div className="flex flex-row justify-between items-center">
                    <span>{t("live_track.current_speed")}</span>
                    <span>
                      <CircleGauge className=" text-gray-400" size={16} />
                    </span>
                  </div>
                  <div className="flex flex-row justify-between items-end">
                    <span className="font-bold text-4xl">
                      {activeVehicle.speed || 0}
                    </span>
                    <span>km/h</span>
                  </div>
                </div>
                <div
                  className={`bg-white border border-gray-300 rounded-lg py-2.5 px-3 flex flex-col gap-2 justify-between`}
                >
                  <div className="flex flex-row justify-between items-center">
                    <span>Total KM</span>
                    <span>
                      <TrendingUp className=" text-gray-400" size={16} />
                    </span>
                  </div>
                  <div className="flex flex-row justify-between items-end">
                    <span
                      className={`font-bold ${activeVehicle.current_mileage > 99000000 ? "text-2xl" : "text-4xl"}`}
                    >
                      {Math.floor(
                        activeVehicle.current_mileage / 1000,
                      ).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
                <div
                  className={`bg-white border border-gray-300 rounded-lg py-2.5 px-3 flex flex-col gap-2 justify-start`}
                >
                  <div className="flex flex-row justify-between items-center">
                    <span>{t("live_track.battery_voltage")}</span>
                    <span>
                      <Zap className=" text-gray-400" size={16} />
                    </span>
                  </div>
                  <div className="flex flex-row justify-between items-end">
                    <span className="font-bold text-4xl">
                      {activeVehicle.battery_voltage || 0}V
                    </span>
                  </div>
                </div>
                <div
                  className={`bg-white border border-gray-300 rounded-lg py-2.5 px-3 flex flex-col gap-2 justify-between`}
                >
                  <div className="flex flex-row justify-between items-center">
                    <span>{t("live_track.last_updated")}</span>
                  </div>
                  <div className="flex flex-col justify-between items-start">
                    <span className="font-bold text-4xl">
                      {activeVehicle.last_updated
                        ? formatedDate(
                            new Date(activeVehicle.last_updated),
                            "HH:mm",
                          )
                        : "--:--"}
                    </span>
                    <span>
                      {activeVehicle.last_updated
                        ? formatedDate(
                            new Date(activeVehicle.last_updated),
                            "dd MMM yyyy",
                          )
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-between gap-4">
                <button
                  onClick={() => {
                    setLoading(true);
                    router.push("/admin/vehicle/" + activeVehicle.id);
                  }}
                  className="font-semibold bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer w-full"
                >
                  {t("live_track.view_vehicle")}
                </button>
                <button
                  // onClick={handleUpdateData}
                  className={`font-semibold bg-[#00A1FE] text-white py-2 rounded-lg select-none hover:bg-[#048ad8] cursor-pointer w-full`}
                >
                  {t("live_track.view_history")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[rgb(249,250,251)] w-88 rounded-xl flex flex-col items-start gap-6 h-full">
            <div className="flex w-full justify-between items-center p-4 pb-0">
              <div className="flex gap-1 items-center">
                <Timer size={20} className="mb-1" />
                <span className="font-semibold text-base">
                  {t("live_track.real_time_fleet")}
                </span>
              </div>
              <span className="border-2 rounded-md border-black py-0.5 px-2.5 text-xs font-semibold">
                LIVE
              </span>
            </div>
            <div className="w-full px-4">
              <div className="flex items-center bg-white w-full px-3 py-2 border border-gray-200 rounded-md shadow">
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
              <div className="flex gap-2 mt-4">
                {vehicleStatusOption.map((item) => (
                  <button
                    key={item.id}
                    className={`px-3 py-2 ${item.id === vehicleStatus ? "bg-" + item.color + "-500 text-white" : "text-" + item.color + "-500 border border-" + item.color + "-500"} cursor-pointer rounded-lg text-xs`}
                    onClick={() => {
                      setVehicleStatus(item.id);
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-300 w-full p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {filteredVehicle.map((item) => (
                <div
                  className={`bg-white border border-gray-300 rounded-lg py-2.5 px-3 flex flex-row justify-between cursor-pointer`}
                  key={item.id}
                  onClick={() => {
                    if (item.lat && item.long) {
                      mapRef.current?.focusTo(item.lat, item.long);
                    }
                    setActiveVehicle(item);
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <div
                      className={`p-2 bg-${vehicleStatusOption.find((i) => i.id === item.status)?.color}-100 rounded-lg`}
                    >
                      <Van
                        color={
                          vehicleStatusOption.find((i) => i.id === item.status)
                            ?.color
                        }
                        size={19}
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      <span className="font-semibold">{item.plate_number}</span>
                      <span className="text-xs">
                        {(item.current_mileage / 1000).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{" "}
                        KM
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <span
                      className={`bg-${vehicleStatusOption.find((i) => i.id === item.status)?.color}-500 rounded-full w-2 h-2`}
                    ></span>
                    <div className="flex items-end flex-col text-xs text-gray-400">
                      {item.last_updated && (
                        <span>
                          <Clock size={14} className="inline mb-0.5 mr-1" />
                          {formatedDate(
                            new Date(item.last_updated),
                            "dd/MM/yyyy - HH:mm",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <InteractiveMapComponent
        ref={mapRef}
        active_vehicle_id={activeVehicle?.id}
        vehicles={filteredVehicle
          .filter((item) => item.lat !== null && item.long !== null)
          .map((item) => ({
            id: item.id,
            name: item.name,
            plate_number: item.plate_number,
            lat: item.lat as number,
            long: item.long as number,
            angle: item.angle ?? 0,
            movement: item.movement ?? false,
          }))}
        onVehicleClick={(id) => {
          if (!id) return;
          const vehicle = rawVehicleData.find((item) => item.id === id);
          if (!vehicle) return;
          console.log(vehicle);
          setActiveVehicle(vehicle);
        }}
      />
    </div>
  );
}
