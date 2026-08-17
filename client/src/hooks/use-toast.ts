export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  action?: { label: string; onClick: () => void };
}

let toastSequence = 0;
type ToastEvent = { type: "show" | "update" | "dismiss"; id?: string; options?: ToastOptions };
const listeners = new Set<(event: ToastEvent) => void>();
export function subscribeToasts(listener: (event: ToastEvent) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function emit(event: ToastEvent) { listeners.forEach((listener) => listener(event)); }

function toast(opts: ToastOptions) {
  const id = `${Date.now()}-${toastSequence++}`;
  emit({ type: "show", id, options: opts });

  return {
    id,
    dismiss: () => emit({ type: "dismiss", id }),
    update: (newOpts: Partial<ToastOptions>) => {
      opts = { ...opts, ...newOpts };
      emit({ type: "update", id, options: opts });
    },
  };
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string) => emit({ type: "dismiss", id }),
    toasts: [],
  };
}

export { useToast, toast };
