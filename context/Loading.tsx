import React, { createContext, useState } from "react";

type Loading = boolean;

interface LoadingContextProps {
  loading: Loading;
  setLoading: React.Dispatch<React.SetStateAction<Loading>>;
}

const LoadingContext = createContext<LoadingContextProps>(
  {} as LoadingContextProps
);

const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<Loading>(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export { LoadingContext, LoadingProvider };
