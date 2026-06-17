import { useLanguage } from "@/context/Language";
import {
  BadgeAlert,
  BadgeCheck,
  Check,
  CircleAlert,
  LockKeyhole,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { ReactNode } from "react";

type AlertType =
  | "success"
  | "error"
  | "warning"
  | "delete"
  | "password"
  | "default";

const ALERT_CONFIG: Record<
  AlertType,
  {
    icon: ReactNode;
    buttonClass: string;
  }
> = {
  success: {
    icon: <BadgeCheck className="w-20 h-20 text-[#00A1FE]" />,
    buttonClass: "",
  },
  error: {
    icon: <BadgeAlert className="w-20 h-20 text-[#EF4444]" />,
    buttonClass: "",
  },
  warning: {
    icon: <TriangleAlert className="w-24 h-24 text-yellow-500" />,
    buttonClass: "bg-yellow-500 hover:bg-yellow-600",
  },
  delete: {
    icon: <Trash2 className="w-7 h-7 text-white" />,
    buttonClass: "bg-[#EF4444] hover:bg-[#cc3b3b]",
  },
  password: {
    icon: <LockKeyhole className="w-7 h-7 text-white" />,
    buttonClass: "bg-[#00A1FE] hover:bg-[#048ad8]",
  },
  default: {
    icon: <></>,
    buttonClass: "",
  },
};

type ConfirmationAlertVariant = "success" | "danger" | "warning";

interface ConfirmationAlertProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  variant?: ConfirmationAlertVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  success: {
    icon: Check,
    iconColor: "text-green-500",
    iconBg: "bg-green-100",
    border: "border-green-500",
    button: "bg-[#1296F3] hover:bg-[#0d82d5]",
  },
  danger: {
    icon: X,
    iconColor: "text-red-500",
    iconBg: "bg-red-100",
    border: "border-red-500",
    button: "bg-[#F04444] hover:bg-[#dc2626]",
  },
  warning: {
    icon: CircleAlert,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-100",
    border: "border-yellow-500",
    button: "bg-yellow-500 hover:bg-yellow-600",
  },
};

export function NotificationAlert({
  visible,
  title,
  subtitle,
  onClose,
  type,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  type: AlertType;
}) {
  const config = ALERT_CONFIG[type];

  return (
    <div
      className={`z-9998 h-dvh fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white shadow-lg px-6 md:px-20 py-10 rounded-lg w-full max-w-[90%] md:max-w-lg text-center transition-transform duration-500 ${
          visible ? "scale-100" : "scale-0"
        }`}
      >
        <div className="flex justify-center">{config.icon}</div>

        <p className="mt-4 text-gray-600 font-bold text-lg">{title}</p>
        <p className="text-[#64748B] mt-1">{subtitle}</p>

        <button
          onClick={onClose}
          className={`px-12 mt-6 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer font-medium`}
        >
          Okay
        </button>
      </div>
    </div>
  );
}

export function ConfirmationAlert({
  visible,
  title,
  subtitle,
  onConfirm,
  onCancel,
  type = "warning",
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: AlertType;
}) {
  const config = ALERT_CONFIG[type];
  const { t } = useLanguage();

  return (
    <div
      className={`z-9998 h-dvh fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white shadow-lg px-10 py-8 rounded-lg w-full max-w-lg text-center transition-transform duration-500 ${
          visible ? "scale-100" : "scale-0"
        }`}
      >
        <div className="flex justify-center items-center bg-[#D9D9D9] rounded-full w-14 h-14 mx-auto ">
          {config.icon}
        </div>

        <p className="mt-6 text-gray-600 font-bold text-lg">{title}</p>
        <p className="text-[#64748B] mt-1">{subtitle}</p>

        <div className="mt-8 flex justify-center gap-6">
          <button
            onClick={onCancel}
            className="px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`${config.buttonClass} px-12 py-2 rounded-lg font-medium text-white cursor-pointer select-none`}
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmationAlert2({
  visible,
  title,
  subtitle,
  variant = "success",
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmationAlertProps) {
  const { t } = useLanguage();

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`fixed inset-0 z-9998 flex h-dvh items-center justify-center bg-black/35 transition-opacity duration-300 ${
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className={`w-full max-w-lg rounded-2xl bg-white px-10 py-8 text-center shadow-xl transition-all duration-500 ${
          visible ? "scale-100" : "scale-0"
        }`}
      >
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${config.iconBg} ${config.border}`}
        >
          <Icon className={`h-7 w-7 ${config.iconColor}`} strokeWidth={2.5} />
        </div>

        <h2 className="mt-6 text-lg font-semibold text-slate-800">{title}</h2>

        {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}

        <div className="mt-8 flex justify-center gap-8">
          <button
            onClick={onCancel}
            className="min-w-32.5 cursor-pointer rounded-lg border border-slate-300 bg-white py-2.5 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {cancelText ?? t("common.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className={`min-w-32.5 cursor-pointer rounded-lg py-2.5 font-medium text-white transition ${config.button}`}
          >
            {confirmText ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
