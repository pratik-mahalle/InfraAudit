import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      position="bottom-right"
      richColors
      closeButton
      visibleToasts={4}
      gap={12}
      icons={{
        success: <CheckCircle2 className="h-5 w-5" />,
        error: <XCircle className="h-5 w-5" />,
        warning: <AlertTriangle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group !w-[min(440px,calc(100vw-2rem))] !items-start !gap-3 !rounded-xl !border-2 !p-5 !pr-11 !shadow-xl backdrop-blur-sm",
          default: "!border-amber-400/80 !bg-amber-50 !text-amber-950 dark:!border-amber-500/60 dark:!bg-amber-950/95 dark:!text-amber-50",
          success: "!border-emerald-400/80 !bg-emerald-50 !text-emerald-950 dark:!border-emerald-500/60 dark:!bg-emerald-950/95 dark:!text-emerald-50",
          error: "!border-red-400/80 !bg-red-50 !text-red-950 dark:!border-red-500/60 dark:!bg-red-950/95 dark:!text-red-50",
          warning: "!border-amber-400/80 !bg-amber-50 !text-amber-950 dark:!border-amber-500/60 dark:!bg-amber-950/95 dark:!text-amber-50",
          info: "!border-blue-400/80 !bg-blue-50 !text-blue-950 dark:!border-blue-500/60 dark:!bg-blue-950/95 dark:!text-blue-50",
          icon: "!mt-0.5 !h-5 !w-5",
          content: "!gap-1.5",
          title: "!text-base !font-bold !leading-6 !tracking-tight",
          description: "!text-sm !leading-5 !opacity-80",
          actionButton: "!h-auto !border-0 !bg-transparent !p-0 !pt-2 !font-semibold !text-current !underline !underline-offset-4 hover:!opacity-70",
          cancelButton: "!bg-transparent !text-current",
          closeButton: "!right-3 !top-3 !left-auto !h-7 !w-7 !translate-x-0 !translate-y-0 !border-0 !bg-transparent !text-current !opacity-70 hover:!opacity-100",
        },
      }}
    />
  );
}
