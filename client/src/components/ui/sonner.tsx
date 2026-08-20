import { Toast, type ToastMessage } from "primereact/toast";
import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { subscribeToasts } from "@/hooks/use-toast";

function toastSeverity(variant?: string) {
  switch (variant) {
    case "destructive": return "error";
    case "success": return "success";
    case "warning": return "warn";
    case "info": return "info";
    default: return "contrast";
  }
}

export function Toaster() {
  useTheme();
  const toastRef = useRef<Toast>(null);
  const activeMessages = useRef(new Map<string, ToastMessage>());

  useEffect(() => subscribeToasts((event) => {
    if (event.type === "dismiss") {
      if (!event.id) {
        activeMessages.current.clear();
        toastRef.current?.clear();
        return;
      }

      const activeMessage = activeMessages.current.get(event.id);
      if (activeMessage) {
        toastRef.current?.remove(activeMessage);
        activeMessages.current.delete(event.id);
      }
      return;
    }

    if (!event.id || !event.options) return;

    const previousMessage = activeMessages.current.get(event.id);
    if (previousMessage) {
      toastRef.current?.remove(previousMessage);
    }

    const message = event.options;
    const severity = toastSeverity(message.variant);
    const summary = message.title || (message.variant === "destructive" ? "Something went wrong" : "Notification");
    const life = message.duration ?? (message.variant === "destructive" ? 6000 : 3000);
    const toastMessage: ToastMessage = {
      id: event.id,
      severity,
      summary,
      detail: message.description,
      life,
      closable: true,
      ...(message.action ? {
        content: (
          <div className="flex w-full flex-col gap-2">
            <div>
              <div className="text-sm font-medium">{summary}</div>
              {message.description && <div className="mt-0.5 text-xs opacity-80">{message.description}</div>}
            </div>
            <button
              type="button"
              className="self-start rounded-md border border-current/20 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-white/10"
              onClick={() => {
                message.action!.onClick();
                const activeMessage = activeMessages.current.get(event.id!);
                if (activeMessage) toastRef.current?.remove(activeMessage);
                activeMessages.current.delete(event.id!);
              }}
            >
              {message.action.label}
            </button>
          </div>
        ),
      } : {}),
    };

    activeMessages.current.set(event.id, toastMessage);
    toastRef.current?.show(toastMessage);
  }), []);

  return (
    <Toast
      ref={toastRef}
      position="bottom-right"
      onRemove={(message) => {
        if (message.id) activeMessages.current.delete(message.id);
      }}
    />
  );
}
