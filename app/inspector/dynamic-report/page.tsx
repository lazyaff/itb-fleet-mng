"use client";

import { NotificationAlert } from "@/components/Alert";
import FormFieldsView from "@/components/form-builder/FormFieldsView";
import { Select } from "@/components/Form";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { FormField } from "@/src/formBuilder";
import { ArrowLeft, ClipboardPlus } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

type Vehicle = {
  id: string;
  plate_number: string;
  name: string;
};

type FormVersion = {
  id: string;
  version: number;
  fields: FormField[];
};

export default function DynamicReport() {
  const { data: session } = useSession() as { data: any };
  const { loading, setLoading } = useContext(LoadingContext);
  const { t } = useLanguage();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formVersion, setFormVersion] = useState<FormVersion | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [conclusion, setConclusion] = useState("");
  const [popUp, setPopUp] = useState("save");

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const fetchData = async () => {
    try {
      const [criteriaRes, formRes] = await Promise.all([
        fetch(`/api/v1/inspection/user/report/criteria`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          cache: "no-store",
        }),
        fetch(`/api/v1/form-builder`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          cache: "no-store",
        }),
      ]);

      const criteriaResult = await criteriaRes.json();
      const formResult = await formRes.json();

      if (!criteriaResult.success) {
        if (criteriaResult.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch");
      }
      setVehicles(criteriaResult.data.vehicle || []);

      if (!formResult.success) {
        if (formResult.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch");
      }
      setFormVersion(formResult.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && !formVersion) {
      fetchData();
    }
  }, [session]);

  const handleAnswerChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isComplete = () => {
    if (!formVersion || !vehicleId || !conclusion) return false;

    return formVersion.fields.every((field) => !!answers[field.id]?.trim());
  };

  const handleSubmit = async () => {
    try {
      if (!formVersion || !isComplete() || loading) return;

      setLoading(true);

      const response = await fetch(`/api/v1/inspector/dynamic-report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form_version_id: formVersion.id,
          vehicle_id: vehicleId,
          conclusion,
          answers: formVersion.fields.map((field) => ({
            field_id: field.id,
            type: field.type,
            value: answers[field.id] ?? "",
          })),
        }),
        cache: "no-store",
      });

      const result = await response.json();
      if (!result.success) {
        if (result.status === 401) {
          handleLogout();
          return;
        }

        if (result.status === 409) {
          setAlert({
            visible: true,
            type: "error",
            title: t("form_builder.stale_version_title"),
            subtitle: t("form_builder.stale_version_subtitle"),
            onClose: () => {
              window.location.reload();
            },
          });
          setLoading(false);
          return;
        }

        setAlert({
          visible: true,
          type: "error",
          title: t("form.error_title"),
          subtitle: result.message,
          onClose: () => {},
        });
        setLoading(false);
        return;
      }

      setAlert({
        visible: true,
        type: "success",
        title: t("form_builder.submit_success_title"),
        subtitle: t("form_builder.submit_success_subtitle"),
        onClose: () => {
          setLoading(true);
          router.push("/inspector/home");
        },
      });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setAlert({
        visible: true,
        type: "error",
        title: t("form.error_title"),
        subtitle: t("form.error_generic"),
        onClose: () => {},
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
        <span className="font-semibold text-base mt-0.5">
          {t("form_builder.inspector_title")}
        </span>
      </div>

      <div className="mt-16 relative">
        <div className="select-text">
          <div className="space-y-4 mb-6">
            <Select
              label={t("form_builder.select_vehicle")}
              data={vehicles}
              value={vehicleId}
              required
              onChange={(val) => setVehicleId(val)}
              displayValue={(item: Vehicle) =>
                `${item.plate_number} - ${item.name}`
              }
              searchKeys={["plate_number", "name"]}
            />
          </div>

          {formVersion && (
            <FormFieldsView
              fields={formVersion.fields}
              mode="interactive"
              answers={answers}
              onAnswerChange={handleAnswerChange}
              conclusion={conclusion}
              onConclusionChange={setConclusion}
            />
          )}
        </div>

        <div
          className={`fixed bottom-0 left-0 right-0 bg-[#F3F3F5] rounded-t-3xl flex justify-center items-center py-8 transform transition-transform duration-500 ease-in-out
                    ${popUp === "save" ? "translate-y-0" : "translate-y-full"}`}
        >
          <button
            onClick={() => {
              if (!isComplete()) return;

              setTimeout(() => {
                setPopUp("");
                setTimeout(() => {
                  setPopUp("confirm");
                }, 500);
              }, 200);
            }}
            className={`w-[85%] rounded-md px-2 py-2 font-semibold text-white ${
              !isComplete() ? "bg-[#00A1FE]/50" : "bg-[#00A1FE]"
            } shadow-xl flex items-center justify-center transition active:scale-90 duration-200`}
          >
            {t("form_builder.submit_button")}
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
              className="mt-4 text-gray-600 font-bold text-lg px-12"
              style={{ lineHeight: 1.25 }}
            >
              {t("form_builder.submit_confirm_title")}
            </p>

            <p className="text-[#64748B] mt-2">
              {t("form_builder.submit_confirm_subtitle")}
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
                {t("common.cancel")}
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
                {t("common.confirm")}
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
