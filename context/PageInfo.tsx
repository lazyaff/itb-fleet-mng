import React, { createContext, useState } from "react";

interface PageInfo {
  title: string;
  subtitle: string;
}

interface PageInfoContextProps {
  pageInfo: PageInfo;
  setPageInfo: React.Dispatch<React.SetStateAction<PageInfo>>;
}

const PageInfoContext = createContext<PageInfoContextProps>(
  {} as PageInfoContextProps,
);

const PageInfoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    title: "Memuat...",
    subtitle: "Memuat...",
  });

  return (
    <PageInfoContext.Provider value={{ pageInfo, setPageInfo }}>
      {children}
    </PageInfoContext.Provider>
  );
};

export { PageInfoContext, PageInfoProvider };
