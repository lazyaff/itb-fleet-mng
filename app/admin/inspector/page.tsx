"use client";

import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { useSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";

export default function Inspector() {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { setPageInfo } = useContext(PageInfoContext);

  useEffect(() => {
    setPageInfo({
      title: "Admin",
      subtitle: "User Inspection",
    });
    setLoading(false);
  }, []);

  return <div className="">lorem ipsum</div>;
}
