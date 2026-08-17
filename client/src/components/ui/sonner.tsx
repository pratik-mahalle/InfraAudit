import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { subscribeToasts, type ToastOptions } from "@/hooks/use-toast";

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
      toastRef.current?.show({
        id,
        severity: message.variant === "destructive" ? "error" : message.variant === "success" ? "success" : message.variant === "warning" ? "warn" : message.variant === "info" ? "info" : "contrast",
        summary: message.title || (message.variant === "destructive" ? "Something went wrong" : "Notification"),
        detail: message.description,
        life: message.duration,
        closable: true,
      });
    });
  }, [messages]);

  return <Toast ref={toastRef} position="bottom-right" />;
}
