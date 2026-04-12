import {
  BadgeAlert,
  BadgeCheck,
  LockKeyhole,
  SquarePen,
  Trash2,
  TriangleAlert,
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
      className={`z-50 h-dvh fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
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
        <p className="text-[#64748B]">{subtitle}</p>

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

  return (
    <div
      className={`z-50 h-dvh fixed inset-0 flex justify-center items-center bg-gray-800/35 transition-opacity duration-500 ${
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
        <p className="text-[#64748B] ">{subtitle}</p>

        <div className="mt-8 flex justify-center gap-6">
          <button
            onClick={onCancel}
            className="px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${config.buttonClass} px-12 py-2 rounded-lg font-medium text-white cursor-pointer select-none`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
