"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { TileLayer } from "react-leaflet";

type Bus = {
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  buses: Bus[];
};

const MapComponent = dynamic(
  () =>
    import("react-leaflet").then((L) => {
      const busIcon = new (require("leaflet").Icon)({
        iconUrl: "/image/bus.png",
        iconSize: [48, 24],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
      });

      const InnerMap = ({ buses }: Props) => {
        const defaultPosition: [number, number] = [-6.918669, 107.683533];

        return (
          <div style={{ height: "500px", width: "100%" }}>
            <L.MapContainer
              center={defaultPosition}
              zoom={12.6}
              zoomSnap={0.1}
              zoomDelta={0.1}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
              />

              {buses.map((bus, index) => (
                <L.Marker
                  key={index}
                  position={[bus.lat, bus.lng]}
                  icon={busIcon}
                >
                  <L.Popup>{bus.name}</L.Popup>
                </L.Marker>
              ))}
            </L.MapContainer>
          </div>
        );
      };

      return InnerMap;
    }),
  { ssr: false },
);

export default MapComponent;
