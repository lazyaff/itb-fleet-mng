"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { TileLayer } from "react-leaflet";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Vehicle = {
  id?: string;
  name: string;
  plate_number: string;
  lat: number;
  long: number;
  angle: number;
  movement: boolean;
};

type Props = {
  vehicles: Vehicle[];
  active_vehicle_id?: string;
  onVehicleClick?: (id: string | null) => void;
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

export type MapRef = {
  focusTo: (lat: number, long: number, zoom?: number) => void;
};

export const InteractiveMapComponent = dynamic(
  async () => {
    const RL = await import("react-leaflet");
    const L = (await import("leaflet")).default;
    await import("leaflet-rotatedmarker");

    const InnerMap = forwardRef<MapRef, Props>(
      ({ vehicles, active_vehicle_id, onVehicleClick }, ref) => {
        const mapRef = useRef<any>(null);

        // expose function ke luar
        useImperativeHandle(ref, () => ({
          focusTo: (lat: number, long: number, zoom = 18) => {
            if (!mapRef.current) return;

            mapRef.current.flyTo([lat, long], zoom, {
              duration: 1.25,
              easeLinearity: 0.25,
            });
          },
        }));

        // component untuk ambil instance map sekali
        const MapSetter = () => {
          const map = RL.useMap();

          useEffect(() => {
            mapRef.current = map;
          }, [map]);

          return null;
        };

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
              center={[-6.918669, 107.683533]}
              zoom={12.6}
              zoomControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              <MapSetter />

              <RL.ZoomControl position="topright" />
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {vehicleData.map((item, index) => (
                <RL.Marker
                  key={index}
                  position={[item.lat, item.long]}
                  icon={item.icon}
                  eventHandlers={{
                    click: () => {
                      if (!mapRef.current) return;
                      if (active_vehicle_id === item.id) return;

                      mapRef.current.flyTo([item.lat, item.long], 18, {
                        duration: 1.25,
                      });

                      onVehicleClick?.(item.id ? item.id : null);
                    },
                  }}
                  {...({
                    rotationAngle: item.angle - 90,
                    rotationOrigin: "center",
                  } as any)}
                />
              ))}
            </RL.MapContainer>
          </div>
        );
      },
    );

    return InnerMap;
  },
  { ssr: false },
);

export default MapComponent;
