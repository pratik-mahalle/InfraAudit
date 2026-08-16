import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  action?: { label: string; onClick: () => void };
}

let toastSequence = 0;

function toast(opts: ToastOptions) {
  const id = `${Date.now()}-${toastSequence++}`;
  showToast(id, opts);

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (newOpts: Partial<ToastOptions>) => {
      opts = { ...opts, ...newOpts };
      showToast(id, opts);
    },
  };
}

function showToast(id: string, opts: ToastOptions) {
  const title = opts.title || (opts.variant === "destructive" ? "Something went wrong" : "Notification");
  const options = {
    id,
    description: opts.description,
    duration: opts.duration,
    action: opts.action,
  };
  switch (opts.variant) {
    case "destructive":
      sonnerToast.error(title, options);
      break;
    case "success":
      sonnerToast.success(title, options);
      break;
    case "warning":
      sonnerToast.warning(title, options);
      break;
    case "info":
      sonnerToast.info(title, options);
      break;
    default:
      sonnerToast(title, options);
  }
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string) => {
      if (id) sonnerToast.dismiss(id);
      else sonnerToast.dismiss();
    },
    toasts: [],
  };
}

export { useToast, toast };
