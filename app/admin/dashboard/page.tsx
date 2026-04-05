"use client";

import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

export default function Dashboard() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { setPageInfo } = useContext(PageInfoContext);
  const router = useRouter();

  useEffect(() => {
    setPageInfo({
      title: "Dashboard",
      subtitle: "",
    });
  }, []);

  return <div>lorem ipsum</div>;
}
