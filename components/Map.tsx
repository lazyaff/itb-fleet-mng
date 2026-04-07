"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { TileLayer } from "react-leaflet";

type Vehicle = {
  name: string;
  plate_number: string;
  lat: number;
  long: number;
  angle: number;
  movement: boolean;
};

type Props = {
  vehicles: Vehicle[];
};

const MapComponent = dynamic(
  async () => {
    const RL = await import("react-leaflet");

    // IMPORT DI SINI (CLIENT ONLY)
    const L = (await import("leaflet")).default;
    await import("leaflet-rotatedmarker");

    const InnerMap = ({ vehicles }: Props) => {
      const defaultPosition: [number, number] = [-6.918669, 107.683533];

      const vehicleData = vehicles.map((item) => ({
        ...item,
        icon: new L.Icon({
          iconUrl: item.movement
            ? "/image/icon-car-1.png"
            : "/image/icon-car-2.png",
          iconSize: [24, 48],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24],
        }),
      }));

      return (
        <div style={{ height: "100%", width: "100%" }}>
          <RL.MapContainer
            center={defaultPosition}
            zoom={12.6}
            zoomSnap={0.1}
            zoomDelta={0.1}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {vehicleData.map((item, index) => (
              <RL.Marker
                key={index}
                position={[item.lat, item.long]}
                icon={item.icon}
                {...({
                  rotationAngle: item.angle - 90,
                  rotationOrigin: "center",
                } as any)}
              >
                <RL.Popup className="text-center">
                  {item.name} <br /> {item.plate_number}
                </RL.Popup>
              </RL.Marker>
            ))}
          </RL.MapContainer>
        </div>
      );
    };

    return InnerMap;
  },
  { ssr: false },
);

export default MapComponent;
