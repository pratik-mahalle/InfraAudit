import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: any;
  [key: string]: any;
}

function toast(opts: ToastOptions) {
  const id = String(Date.now());

  if (opts.variant === "destructive") {
    sonnerToast.error(opts.title || "Error", {
      id,
      description: opts.description,
      duration: opts.duration,
    });
  } else {
    sonnerToast(opts.title || "", {
      id,
      description: opts.description,
      duration: opts.duration,
    });
  }

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (newOpts: Partial<ToastOptions>) => {
      const variant = newOpts.variant ?? opts.variant;
      const title = newOpts.title || opts.title || "";
      const description = newOpts.description || opts.description;
      if (variant === "destructive") {
        sonnerToast.error(title, { id, description });
      } else {
        sonnerToast(title, { id, description });
      }
    },
  };
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
