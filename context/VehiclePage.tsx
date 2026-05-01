import React, { createContext, useState } from "react";

interface VehiclePage {
  page: string | null;
  vehicle_id: string | null;
}

interface VehiclePageContextProps {
  vehiclePage: VehiclePage;
  setVehiclePage: React.Dispatch<React.SetStateAction<VehiclePage>>;
}

const VehiclePageContext = createContext<VehiclePageContextProps>(
  {} as VehiclePageContextProps,
);

const VehiclePageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [vehiclePage, setVehiclePage] = useState<VehiclePage>({
    page: null,
    vehicle_id: null,
  });

  return (
    <VehiclePageContext.Provider value={{ vehiclePage, setVehiclePage }}>
      {children}
    </VehiclePageContext.Provider>
  );
};

export { VehiclePageContext, VehiclePageProvider };
