import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { subscribeToasts, type ToastOptions } from "@/hooks/use-toast";

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
  const [messages, setMessages] = useState<Record<string, ToastOptions>>({});

  useEffect(() => subscribeToasts((event) => {
    setMessages((current) => {
      if (event.type === "dismiss") {
        if (!event.id) return {};
        const next = { ...current }; delete next[event.id]; return next;
      }
      return { ...current, [event.id!]: event.options! };
    });
  }), []);

  useEffect(() => {
    toastRef.current?.clear();
    Object.entries(messages).forEach(([id, message]) => {
      const severity = toastSeverity(message.variant);
      const summary = message.title || (message.variant === "destructive" ? "Something went wrong" : "Notification");
      const life = message.duration ?? (message.variant === "destructive" ? 6000 : 3000);

      toastRef.current?.show({
        id,
        severity,
        summary,
        detail: message.description,
        life,
        closable: true,
        ...(message.action ? {
          content: (
            <div className="flex flex-col gap-2 w-full">
              <div>
                <div className="font-medium text-sm">{summary}</div>
                {message.description && <div className="text-xs opacity-80 mt-0.5">{message.description}</div>}
              </div>
              <button
                type="button"
                className="self-start rounded-md border border-current/20 px-2.5 py-1 text-xs font-medium hover:bg-white/10 transition-colors"
                onClick={() => {
                  message.action!.onClick();
                  toastRef.current?.clear();
                }}
              >
                {message.action.label}
              </button>
            </div>
          ),
        } : {}),
      });
    });
  }, [messages]);

  return <Toast ref={toastRef} position="bottom-right" />;
}
