import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Slide,
  ToastContainer,
  toast as baseToast,
  type Id,
  type ToastOptions,
  type TypeOptions,
} from "react-toastify";
import "./toast.css";

type ToastKind = Extract<TypeOptions, "default" | "success" | "error" | "info" | "warning">;
type ToastMessage = ReactNode;

const toastMeta: Record<
  ToastKind,
  { icon: LucideIcon; label: string; className: string }
> = {
  default: {
    icon: ShieldCheck,
    label: "Pickup Zone",
    className: "default",
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    className: "success",
  },
  error: {
    icon: XCircle,
    label: "Attention needed",
    className: "error",
  },
  info: {
    icon: Info,
    label: "Update",
    className: "info",
  },
  warning: {
    icon: AlertTriangle,
    label: "Notice",
    className: "warning",
  },
};

function classList(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

function ToastContent({
  kind,
  message,
}: {
  kind: ToastKind;
  message: ToastMessage;
}) {
  const meta = toastMeta[kind];
  const Icon = meta.icon;

  return (
    <div className={classList("pz-toast-content", `pz-toast-content-${meta.className}`)}>
      <div className="pz-toast-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.4} />
      </div>
      <div className="pz-toast-copy">
        <div className="pz-toast-label">{meta.label}</div>
        <div className="pz-toast-message">{message}</div>
      </div>
    </div>
  );
}

function showToast(
  kind: ToastKind,
  message: ToastMessage,
  options?: ToastOptions
): Id {
  return baseToast(<ToastContent kind={kind} message={message} />, {
    ...options,
    type: kind,
    icon: false,
    closeButton: false,
    className: classList("pz-toast-shell", `pz-toast-shell-${toastMeta[kind].className}`),
    progressClassName: classList(
      "pz-toast-progress",
      `pz-toast-progress-${toastMeta[kind].className}`
    ),
  });
}

type AppToast = {
  (message: ToastMessage, options?: ToastOptions): Id;
  success: (message: ToastMessage, options?: ToastOptions) => Id;
  error: (message: ToastMessage, options?: ToastOptions) => Id;
  info: (message: ToastMessage, options?: ToastOptions) => Id;
  warn: (message: ToastMessage, options?: ToastOptions) => Id;
  warning: (message: ToastMessage, options?: ToastOptions) => Id;
  dismiss: typeof baseToast.dismiss;
  clearWaitingQueue: typeof baseToast.clearWaitingQueue;
  isActive: typeof baseToast.isActive;
  update: typeof baseToast.update;
  promise: typeof baseToast.promise;
  loading: (message: ToastMessage, options?: ToastOptions) => Id;
};

const appToast = ((message: ToastMessage, options?: ToastOptions) =>
  showToast("default", message, options)) as AppToast;

appToast.success = (message, options) => showToast("success", message, options);
appToast.error = (message, options) => showToast("error", message, options);
appToast.info = (message, options) => showToast("info", message, options);
appToast.warn = (message, options) => showToast("warning", message, options);
appToast.warning = appToast.warn;
appToast.dismiss = baseToast.dismiss;
appToast.clearWaitingQueue = baseToast.clearWaitingQueue;
appToast.isActive = baseToast.isActive;
appToast.update = baseToast.update;
appToast.promise = baseToast.promise;
appToast.loading = (message, options) =>
  baseToast.loading(<ToastContent kind="info" message={message} />, {
    ...options,
    icon: false,
    closeButton: false,
    className: "pz-toast-shell pz-toast-shell-info pz-toast-shell-loading",
    progressClassName: "pz-toast-progress pz-toast-progress-info",
  });

export const toast = appToast;

export function AppToastContainer() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3400}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={4}
      transition={Slide}
      theme="dark"
      icon={false}
      closeButton={false}
      className="pz-toast-container"
      toastClassName="pz-toast-shell"
      progressClassName="pz-toast-progress"
    />
  );
}

export { AppToastContainer as ToastContainer };
