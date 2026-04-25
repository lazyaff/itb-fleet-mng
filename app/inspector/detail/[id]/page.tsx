"use client";

import { LoadingContext } from "@/context/Loading";
import { inspectionConclusionForm } from "@/src/dropdown";
import { ArrowLeft, Award, NotepadText } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useContext, useEffect, useState } from "react";

type InspectionAnswer = {
  label: string;
  description: string;
  value: number;
};

type InspectionQuestion = {
  order: number;
  title: string;
  answer: InspectionAnswer;
};

type InspectionSection = {
  title: string;
  icon: string;
  order: number;
  questions: InspectionQuestion[];
};

type Vehicle = {
  plate_number: string;
  name: string;
};

type DataProps = {
  id: string;
  inspector: string;
  date: string;
  vehicle: Vehicle;
  conclusion: string;
  notes: string;
  sections: InspectionSection[];
};

export default function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  {
    const { id } = use(params);
    const { data: session } = useSession() as { data: any };
    const { setLoading } = useContext(LoadingContext);
    const router = useRouter();
    const [reportData, setReportData] = useState<DataProps>();

    const handleLogout = async () => {
      await signOut({ redirect: false });
      router.push("/");
    };

    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/v1/inspection/user/history/detail?id=${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.user?.access_token}`,
            },
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!result.success) {
          if (result.status === 401) {
            handleLogout();
            return;
          }
          throw new Error("Failed to fetch");
        }

        setReportData(result.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (session && !reportData) {
        fetchData();
      }
    }, [session]);

    return (
      <div className="min-h-dvh bg-white pb-10 max-w-md mx-auto relative text-sm select-none p-6">
        <div className="flex justify-start items-center gap-4 p-4 border-b border-gray-300 fixed top-0 left-0 bg-white w-full z-50">
          <button
            onClick={() => {
              setLoading(true);
              router.push("/inspector/home");
            }}
          >
            <ArrowLeft />
          </button>
          <span className="font-semibold text-base mt-0.5">
            Inspection Form
          </span>
        </div>

        <div className="mt-16 relative">
          <div className="select-text">
            <div className="space-y-4 mb-6">
              <div className="w-full">
                <label className="block mb-2">Date</label>
                <input
                  autoComplete="off"
                  type="text"
                  value={reportData?.date || ""}
                  readOnly
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
              <div className="w-full">
                <label className="block mb-2">Vehicle</label>
                <input
                  autoComplete="off"
                  type="text"
                  value={
                    reportData?.vehicle.plate_number
                      ? reportData?.vehicle.plate_number +
                        " - " +
                        reportData?.vehicle.name
                      : ""
                  }
                  readOnly
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div className="space-y-4">
              {reportData?.sections.map((section) => (
                <div
                  key={section.order}
                  className="bg-white shadow-md rounded-xl"
                >
                  <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                    <div className="font-semibold flex gap-2 items-center text-base">
                      <img
                        src={section.icon}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                      Bagian {section.order}: {section.title}
                    </div>
                  </div>

                  {section.questions.map((question, questionIndex) => (
                    <div
                      key={question.order}
                      className={`p-6 ${questionIndex > 0 && "border-t border-gray-200"}`}
                    >
                      <h4 className="font-semibold mb-3">
                        {section.order}.{question.order} {question.title}
                      </h4>

                      <label className="flex gap-2 cursor-pointer items-start mb-2">
                        <div>
                          {question.answer.label}: {question.answer.description}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ))}
              <div className="bg-white shadow-md rounded-xl">
                <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                  <div className="font-semibold flex gap-2 items-center text-base">
                    <Award
                      className="mb-2"
                      strokeWidth={2.5}
                      size={20}
                      color="#00A1FE"
                    />
                    <span>
                      Rekomendasi Akhir Inspektor <br /> Kesimpulan Penilaian
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <label className="flex gap-2 cursor-pointer items-start mb-2">
                    <div>
                      <b>{reportData?.conclusion}</b> (
                      {
                        inspectionConclusionForm.find(
                          (conclusion) =>
                            conclusion.value === reportData?.conclusion,
                        )?.subtitle
                      }
                      ).
                    </div>
                  </label>
                </div>
              </div>
              <div className="bg-white shadow-md rounded-xl">
                <div className="bg-[#F8FAFC] px-6 pt-6 pb-5 border-b border-gray-200 rounded-t-xl">
                  <div className="font-semibold flex gap-2 items-center text-base">
                    <NotepadText strokeWidth={2} size={18} color="#00A1FE" />
                    Notes
                  </div>
                  <p className="text-gray-600 mt-1">Catatan Tambahan</p>
                </div>

                <div className="p-6">
                  <div className="w-full">
                    <textarea
                      readOnly
                      rows={4}
                      autoComplete="off"
                      value={reportData?.notes || ""}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
