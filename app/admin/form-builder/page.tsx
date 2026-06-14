"use client";

import { ConfirmationAlert, NotificationAlert } from "@/components/Alert";
import FormFieldsView from "@/components/form-builder/FormFieldsView";
import PGFieldCard from "@/components/form-builder/PGFieldCard";
import RecommendationCard from "@/components/form-builder/RecommendationCard";
import TextFieldCard from "@/components/form-builder/TextFieldCard";
import { useLanguage } from "@/context/Language";
import { LoadingContext } from "@/context/Loading";
import { PageInfoContext } from "@/context/PageInfo";
import { FormField, validateFormFields } from "@/src/formBuilder";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Eye, Plus, Send, SlidersHorizontal } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export default function FormBuilder() {
  const { data: session } = useSession() as { data: any };
  const { setLoading } = useContext(LoadingContext);
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { setPageInfo } = useContext(PageInfoContext);

  const [draft, setDraft] = useState<FormField[]>([]);
  const [view, setView] = useState<"builder" | "preview">("builder");
  const [currentVersion, setCurrentVersion] = useState(0);
  const [publishedAt, setPublishedAt] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({});
  const [showValidationBanner, setShowValidationBanner] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    setPageInfo({
      title: t("sidebar.admin"),
      subtitle: t("sidebar.form_builder"),
    });
  }, [lang]);

  useEffect(() => {
    if (session && currentVersion === 0) fetchData();
  }, [session]);

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => router.push("/"));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/form-builder`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();
      if (result.success) {
        setDraft(result.data.fields as FormField[]);
        setCurrentVersion(result.data.version);
        setPublishedAt(result.data.published_at);
      } else if (result.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      lang === "id" ? "id-ID" : "en-US",
      { day: "numeric", month: "long", year: "numeric" },
    );
  };

  const handleFieldChange = (id: string, updated: FormField) => {
    setDraft((prev) =>
      prev.map((field) => (field.id === id ? updated : field)),
    );
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draft.length) return;

    setDraft((prev) => {
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];
      return updated;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraft((prev) => {
      const oldIndex = prev.findIndex((field) => field.id === active.id);
      const newIndex = prev.findIndex((field) => field.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleAddField = (type: "PG" | "TEXT") => {
    const newField: FormField =
      type === "PG"
        ? {
            id: crypto.randomUUID(),
            type: "PG",
            name: "",
            choices: ["", "", "", ""],
          }
        : { id: crypto.randomUUID(), type: "TEXT", name: "" };

    setDraft((prev) => [...prev, newField]);
  };

  const handleDeleteField = (id: string) => {
    setDraft((prev) => prev.filter((field) => field.id !== id));
    setDeleteConfirmId(null);
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handlePublishClick = () => {
    const errors = validateFormFields(draft);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowValidationBanner(true);
      return;
    }

    setValidationErrors({});
    setShowValidationBanner(false);
    setConfirmPublish(true);
  };

  const handlePublishConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/form-builder/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: draft }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentVersion(result.data.version);
        setPublishedAt(result.data.published_at);
        setDraft(result.data.fields as FormField[]);
        setAlert({
          visible: true,
          type: "success",
          title: t("form.success_title"),
          subtitle: t("form_builder.publish_success"),
          onClose: () => {},
        });
      } else {
        if (result.status === 401) {
          handleLogout();
          return;
        }

        if (result.data?.errors) {
          setValidationErrors(result.data.errors);
          setShowValidationBanner(true);
        }

        setAlert({
          visible: true,
          type: "error",
          title: t("form.error_title"),
          subtitle: result.message,
          onClose: () => {},
        });
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      setAlert({
        visible: true,
        type: "error",
        title: t("form.error_title"),
        subtitle: t("form.error_generic"),
        onClose: () => {},
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col min-h-full max-w-6xl mx-auto w-full">
      <div className="mb-4 flex flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("form_builder.title")}
          </h1>
          <p className="text-[#64748B] mt-1">
            {t("form_builder.current_label")}{" "}
            <span className="text-[#00A1FE] font-semibold">
              v{currentVersion}
            </span>{" "}
            · {t("form_builder.published_label")} {formatDate(publishedAt)}
          </p>
        </div>

        <div className="flex flex-row items-center gap-3">
          <div className="relative flex bg-white border border-gray-200 rounded-md p-1">
            <div
              className={`absolute top-1 left-1 h-[calc(100%-8px)] w-36 rounded-md bg-gray-900 transition-transform duration-300 ease-in-out ${
                view === "preview" ? "translate-x-36" : "translate-x-0"
              }`}
            />
            <button
              onClick={() => setView("builder")}
              className={`relative z-10 w-36 px-6 py-2 font-medium cursor-pointer select-none flex items-center justify-center gap-2 transition-colors duration-300 ${
                view === "builder" ? "text-white" : "text-gray-600"
              }`}
            >
              <SlidersHorizontal size={16} />
              {t("form_builder.builder_tab")}
            </button>
            <button
              onClick={() => setView("preview")}
              className={`relative z-10 w-36 px-6 py-2 font-medium cursor-pointer select-none flex items-center justify-center gap-2 transition-colors duration-300 ${
                view === "preview" ? "text-white" : "text-gray-600"
              }`}
            >
              <Eye size={16} />
              {t("form_builder.preview_tab")}
            </button>
          </div>

          <button
            onClick={handlePublishClick}
            className="bg-[#00A1FE] hover:bg-[#048ad8] text-white py-2 px-6 rounded-md cursor-pointer select-none font-semibold flex items-center gap-2"
          >
            <Send size={16} />
            {t("form_builder.publish_button")}
          </button>
        </div>
      </div>

      {showValidationBanner && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3">
          {t("form_builder.validation_banner")}
        </div>
      )}

      {view === "builder" ? (
        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={draft.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              {draft.map((field, index) =>
                field.type === "PG" ? (
                  <PGFieldCard
                    key={field.id}
                    field={field}
                    isFirst={index === 0}
                    isLast={index === draft.length - 1}
                    error={!!validationErrors[field.id]}
                    deleteConfirm={deleteConfirmId === field.id}
                    onChange={(updated) =>
                      handleFieldChange(field.id, updated)
                    }
                    onMoveUp={() => handleMove(index, -1)}
                    onMoveDown={() => handleMove(index, 1)}
                    onRequestDelete={() => setDeleteConfirmId(field.id)}
                    onConfirmDelete={() => handleDeleteField(field.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ) : (
                  <TextFieldCard
                    key={field.id}
                    field={field}
                    isFirst={index === 0}
                    isLast={index === draft.length - 1}
                    error={!!validationErrors[field.id]}
                    deleteConfirm={deleteConfirmId === field.id}
                    onChange={(updated) =>
                      handleFieldChange(field.id, updated)
                    }
                    onMoveUp={() => handleMove(index, -1)}
                    onMoveDown={() => handleMove(index, 1)}
                    onRequestDelete={() => setDeleteConfirmId(field.id)}
                    onConfirmDelete={() => handleDeleteField(field.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ),
              )}
            </SortableContext>
          </DndContext>

          <RecommendationCard />

          <div className="flex flex-row gap-3">
            <button
              onClick={() => handleAddField("PG")}
              className="flex-1 font-semibold px-6 py-3 bg-blue-50/50 text-[#00A1FE] border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 cursor-pointer select-none flex items-center justify-center gap-2"
            >
              <Plus size={18} /> {t("form_builder.add_field")}
            </button>
            <button
              onClick={() => handleAddField("TEXT")}
              className="flex-1 font-semibold px-6 py-3 bg-purple-50/50 text-purple-600 border-2 border-dashed border-purple-200 rounded-xl hover:bg-purple-50 cursor-pointer select-none flex items-center justify-center gap-2"
            >
              <Plus size={18} /> {t("form_builder.add_text_field")}
            </button>
          </div>
        </div>
      ) : (
        <FormFieldsView fields={draft} mode="preview" />
      )}

      {/* Publish confirmation */}
      <ConfirmationAlert
        title={t("form_builder.publish_modal_title")}
        subtitle={t("form_builder.publish_modal_subtitle")}
        visible={confirmPublish}
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => {
          setConfirmPublish(false);
          setTimeout(() => handlePublishConfirm(), 300);
        }}
      />

      {/* Alert */}
      <NotificationAlert
        title={alert.title}
        subtitle={alert.subtitle}
        visible={alert.visible}
        type={alert.type}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          setTimeout(() => alert.onClose(), 300);
        }}
      />
    </div>
  );
}
