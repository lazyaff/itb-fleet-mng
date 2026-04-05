import { CircleCheckBig, CircleX, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";

type AlertType = "success" | "error" | "warning";

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
      className={`z-50 h-dvh fixed inset-0 flex justify-center items-center bg-gray-800/50 transition-opacity duration-500 ${
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
          className={`${config.buttonClass} mt-6 px-6 py-2 rounded-lg font-medium text-white cursor-pointer text-sm md:text-base`}
        >
          Ok
        </button>
      </div>
    </div>
  );
}

export function ConfirmationAlert({
  visible,
  message,
  onConfirm,
  onCancel,
  type = "warning",
}: {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: AlertType;
}) {
  const config = ALERT_CONFIG[type];

  return (
    <div
      className={`z-50 h-dvh fixed inset-0 flex justify-center items-center bg-gray-800/50 transition-opacity duration-500 ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white shadow-lg px-6 py-10 rounded-lg w-full max-w-sm text-center transition-transform duration-500 ${
          visible ? "scale-100" : "scale-0"
        }`}
      >
        <div className="flex justify-center">{config.icon}</div>

        <p className="mt-4 text-gray-600">{message}</p>

        <div className="mt-6 flex justify-center gap-4">
          {/* NO */}
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg font-medium bg-gray-300 hover:bg-gray-400 text-gray-800 cursor-pointer"
          >
            No
          </button>

          {/* YES */}
          <button
            onClick={onConfirm}
            className={`${config.buttonClass} px-6 py-2 rounded-lg font-medium text-white cursor-pointer`}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
