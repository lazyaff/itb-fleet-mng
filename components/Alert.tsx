import {
  CircleCheckBig,
  CircleX,
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
  | "edit"
  | "default";

const ALERT_CONFIG: Record<
  AlertType,
  {
    icon: ReactNode;
    buttonClass: string;
  }
> = {
  success: {
    icon: <CircleCheckBig className="w-24 h-24 text-green-600" />,
    buttonClass: "bg-green-500 hover:bg-green-600",
  },
  error: {
    icon: <CircleX className="w-24 h-24 text-red-600" />,
    buttonClass: "bg-red-500 hover:bg-red-600",
  },
  warning: {
    icon: <TriangleAlert className="w-24 h-24 text-yellow-500" />,
    buttonClass: "bg-yellow-500 hover:bg-yellow-600",
  },
  delete: {
    icon: <Trash2 className="w-7 h-7 text-white" />,
    buttonClass: "bg-[#EF4444] hover:bg-[#cc3b3b]",
  },
  edit: {
    icon: <SquarePen className="w-24 h-24 text-yellow-500" />,
    buttonClass: "bg-blue-500 hover:bg-blue-600",
  },
  default: {
    icon: <></>,
    buttonClass: "",
  },
};

export function NotificationAlert({
  visible,
  message,
  onClose,
  type,
}: {
  visible: boolean;
  message: string;
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
        className={`bg-white shadow-lg px-6 py-10 rounded-lg w-full max-w-[90%] md:max-w-sm text-center transition-transform duration-500 ${
          visible ? "scale-100" : "scale-0"
        }`}
      >
        <div className="flex justify-center">{config.icon}</div>

        <p className="mt-4 text-gray-600 text-sm md:text-base">{message}</p>

        <button
          onClick={onClose}
          className={`${config.buttonClass} mt-6 px-6 py-2 rounded-lg font-medium text-white cursor-pointer text-sm md:text-base select-none`}
        >
          OK
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
        className={`bg-white shadow-lg px-6 py-8 rounded-lg w-full max-w-lg text-center transition-transform duration-500 ${
          visible ? "scale-100" : "scale-0"
        }`}
      >
        <div className="flex justify-center items-center bg-[#D9D9D9] rounded-full w-14 h-14 mx-auto ">
          {config.icon}
        </div>

        <p className="mt-6 text-gray-600 font-bold text-lg">{title}</p>
        <p className="text-[#64748B] ">{subtitle}</p>

        <div className="mt-8 flex justify-center gap-6">
          {/* NO */}
          <button
            onClick={onCancel}
            className="px-12 bg-white text-black border border-gray-500 py-2 rounded-lg hover:bg-gray-100 select-none cursor-pointer font-medium"
          >
            Cancel
          </button>

          {/* YES */}
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
