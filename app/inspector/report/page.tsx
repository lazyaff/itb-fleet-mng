"use client";

import { NotificationAlert } from "@/components/Alert";
import { Select } from "@/components/Form";
import { LoadingContext } from "@/context/Loading";
import { inspectionConclusionForm } from "@/src/dropdown";
import { ArrowLeft, Award, ClipboardPlus, NotepadText } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type Vehicle = {
  id: string;
  plate_number: string;
  name: string;
};

type Option = {
  id: string;
  label: "None" | "Low" | "Medium" | "High"; // bisa string kalau mau fleksibel
  description: string;
};

type Question = {
  id: string;
  title: string;
  order: number;
  options: Option[];
};

type Criteria = {
  id: string;
  title: string;
  order: number;
  icon: string;
  questions: Question[];
};

type DataProps = {
  vehicle: Vehicle[];
  criteria: Criteria[];
};

type FormAnswer = {
  date: string;
  vehicle_id: string;
  conclusion: string;
  notes: string | null;
};

type Answer = {
  question_id: string;
  option_id: string | null;
};

export default function Report() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const router = useRouter();
  const [formData, setFormData] = useState<DataProps>();
  const [formAnswer, setFormAnswer] = useState<FormAnswer>({
    date: "",
    vehicle_id: "",
    conclusion: "",
    notes: null,
  });
  const [alert, setAlert] = useState<{
    visible: boolean;
    type: "success" | "error" | "default";
    title: string;
    subtitle?: string;
    onClose: () => void;
  }>({
    visible: false,
    type: "default",
    title: "",
    subtitle: "",
    onClose: () => {},
  });
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [popUp, setPopUp] = useState("save");

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/v1/inspection/user/report/criteria`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!result.success) {
        if (result.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch");
      }

      setFormData(result.data);

      const initialAnswers = result.data.criteria.flatMap((section: Criteria) =>
        section.questions.map((question) => ({
          question_id: question.id,
          option_id: null,
        })),
      );

      setAnswers(initialAnswers);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && !formData) {
      fetchData();
    }
  }, [session]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) =>
      prev.map((item) =>
        item.question_id === questionId
          ? {
              ...item,
              option_id: optionId,
            }
          : item,
      ),
    );
  };

  const handleSubmit = async () => {
    try {
      if (
        !formAnswer.date ||
        !formAnswer.vehicle_id ||
        !formAnswer.conclusion ||
        answers.some((a) => !a.option_id) ||
        loading
      )
        return;

      setLoading(true);
      const response = await fetch(`/api/v1/inspection/user/report/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: JSON.stringify({
          ...formAnswer,
          answer_ids: answers.map((a) => a.option_id),
        }),
        cache: "no-store",
      });

      const result = await response.json();
      if (!result.success) {
        if (result.status === 401) {
          handleLogout();
          return;
        } else {
          setAlert({
            visible: true,
            type: "error",
            title: "Failed",
            subtitle: result.message,
            onClose: () => {
              setAlert({
                type: "error",
                title: "Failed",
                subtitle: result.message,
                visible: false,
                onClose: () => {},
              });
            },
          });
          setLoading(false);
        }
      } else {
        setAlert({
          visible: true,
          type: "success",
          title: "Successful",
          subtitle:
            "Congratulations! You have successfully submitted the report.",
          onClose: () => {
            setLoading(true);
            router.push("/inspector/home");
          },
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setAlert({
        visible: true,
        type: "error",
        title: "Failed",
        subtitle: "Something went wrong. Please try again later.",
        onClose: () => {
          setAlert({
            type: "error",
            title: "Failed",
            subtitle: "Something went wrong. Please try again later.",
            visible: false,
            onClose: () => {},
          });
        },
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white pb-32 max-w-md mx-auto relative text-sm select-none p-6">
      <div className="flex justify-start items-center gap-4 p-4 border-b border-gray-300 fixed top-0 left-0 bg-white w-full z-50">
        <button
          onClick={() => {
            setLoading(true);
            router.push("/inspector/home");
          }}
        >
          <ArrowLeft />
        </button>
        <span className="font-semibold text-base mt-0.5">Inspection Form</span>
      </div>

      <div className="mt-16 relative">
        <div className="select-text">
          <div className="space-y-4 mb-6">
            <div className="w-full">
              <label className="block mb-2">
                Select Date <span className="text-red-500">*</span>
              </label>
              <input
                autoComplete="off"
                type="date"
                value={formAnswer?.date}
                onChange={(e) =>
                  setFormAnswer({
                    ...formAnswer,
                    date: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <Select
              label="Select Vehicle"
              data={formData?.vehicle || []}
              value={formAnswer?.vehicle_id}
              required
              onChange={(val) => {
                setFormAnswer({
                  ...formAnswer,
                  vehicle_id: val,
                });
              }}
              displayValue={(item: any) =>
                `${item.plate_number} - ${item.name}`
              }
              searchKeys={["plate_number", "name"]}
            />
          </div>
          <div className="space-y-4">
            {formData?.criteria.map((section) => (
              <div key={section.id} className="bg-white shadow-md rounded-xl">
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
                    key={question.id}
                    className={`p-6 ${questionIndex > 0 && "border-t border-gray-200"}`}
                  >
                    <h4 className="font-semibold mb-3">
                      {section.order}.{question.order} {question.title}
                    </h4>

                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        onClick={() =>
                          handleSelectOption(question.id, option.id)
                        }
                        className="flex gap-2 cursor-pointer items-start mb-2"
                      >
                        <input
                          type="radio"
                          checked={
                            answers.find((a) => a.question_id === question.id)
                              ?.option_id === option.id
                          }
                          readOnly
                          className="mt-1"
                        />
                        <div
                          className={
                            answers.find((a) => a.question_id === question.id)
                              ?.option_id === option.id
                              ? "font-semibold"
                              : ""
                          }
                        >
                          {option.label}: {option.description}
                        </div>
                      </label>
                    ))}
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
                    (Pilih Satu):
                  </span>
                </div>
              </div>

              <div className="p-6">
                {inspectionConclusionForm.map((option) => (
                  <label
                    key={option.value}
                    onClick={() =>
                      setFormAnswer({ ...formAnswer, conclusion: option.value })
                    }
                    className="flex gap-2 cursor-pointer items-start mb-2"
                  >
                    <input
                      type="radio"
                      checked={formAnswer.conclusion === option.value}
                      readOnly
                      className="mt-1"
                    />
                    <div>
                      <b>{option.title}</b> ({option.subtitle}).
                    </div>
                  </label>
                ))}
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
                  <label className="block mb-2">Additional Notes</label>
                  <textarea
                    rows={4}
                    autoComplete="off"
                    value={formAnswer?.notes || ""}
                    placeholder="Tuliskan detail part yang bermasalah atau estimasi perbaikan di sini"
                    onChange={(e) =>
                      setFormAnswer({
                        ...formAnswer,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`fixed bottom-0 left-0 right-0 bg-[#F3F3F5] active:scale-90 rounded-t-3xl flex justify-center items-center py-8 transform transition-transform duration-500 ease-in-out
                    ${popUp === "save" ? "translate-y-0" : "translate-y-full"}`}
        >
          <button
            onClick={() => {
              if (
                !formAnswer.date ||
                !formAnswer.vehicle_id ||
                !formAnswer.conclusion ||
                answers.some((a) => !a.option_id)
              ) {
                return;
              }
              setTimeout(() => {
                setPopUp("");
                setTimeout(() => {
                  setPopUp("confirm");
                }, 500);
              }, 200);
            }}
            className={`w-[85%] rounded-md px-2 py-2 font-semibold text-white ${
              !formAnswer.date ||
              !formAnswer.vehicle_id ||
              !formAnswer.conclusion ||
              answers.some((a) => !a.option_id)
                ? "bg-[#00A1FE]/50"
                : "bg-[#00A1FE]"
            } shadow-xl flex items-center justify-center transition active:scale-90 duration-200`}
          >
            Save
          </button>
        </div>

        <div
          className={`z-70 fixed inset-0 flex flex-col justify-end items-center bg-gray-800/35 transition-opacity duration-500
                  ${
                    popUp === "confirm"
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  }`}
        >
          <div
            className={`bg-[#F3F3F5] shadow-lg px-6 py-10 rounded-t-3xl w-full text-center transform transition-transform duration-500 ease-in-out
            ${popUp === "confirm" ? "translate-y-0" : "translate-y-full"}`}
          >
            <div className="flex justify-center items-center bg-[#D9D9D9] rounded-full w-14 h-14 mx-auto">
              <ClipboardPlus className="w-8 h-8 text-white" />
            </div>
            <p
              className="mt-4 text-gray-600 font-bold text-lg px-16"
              style={{ lineHeight: 1.25 }}
            >
              Are you sure you want to submit this form?
            </p>

            <p className="text-[#64748B] mt-2">
              Once you submit the form you can’t edit it
            </p>

            <div className="flex flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setTimeout(() => {
                    setPopUp("");
                    setTimeout(() => {
                      setPopUp("save");
                    }, 500);
                  }, 200);
                }}
                className="px-12 mt-6 bg-white text-black border border-gray-500 py-2 rounded-lg transition active:scale-90 duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTimeout(() => {
                    setPopUp("");
                    setTimeout(() => {
                      setPopUp("save");
                      handleSubmit();
                    }, 500);
                  }, 200);
                }}
                className="px-12 mt-6 bg-[#00A1FE] text-white py-2 rounded-lg transition active:scale-90 duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      <NotificationAlert
        title={alert.title}
        subtitle={alert.subtitle}
        visible={alert.visible}
        type={alert.type}
        onClose={() => {
          alert.onClose();
        }}
      />
    </div>
  );
}
