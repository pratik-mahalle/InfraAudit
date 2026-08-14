import { Laptop, ShieldCheck } from "lucide-react";
import { InfraAuditLogo } from "@/components/ui/InfraAuditLogo";
import { Button } from "@/components/ui/button";
import { DESKTOP_MIN_WIDTH } from "@/hooks/use-desktop-viewport";

export function DesktopRequiredScreen() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background px-5 py-10 text-foreground">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <main className="relative mx-auto flex w-full max-w-lg flex-col items-center justify-center text-center">
        <a href="/" aria-label="Go to the InfrAudit homepage">
          <InfraAuditLogo height={34} className="dark:hidden" />
          <InfraAuditLogo height={34} variant="dark" className="hidden dark:block" />
        </a>

        <section className="mt-10 w-full rounded-2xl border border-border bg-card/90 p-7 shadow-xl shadow-black/5 backdrop-blur sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Laptop className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Desktop access only
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Open InfrAudit on a desktop
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            The InfrAudit workspace is designed for screens at least {DESKTOP_MIN_WIDTH}px wide.
            This page will open automatically when your browser is wide enough.
          </p>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 text-left">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Your workspace is safe</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your account, connected providers, and scan data remain unchanged.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="mt-7">
            <a href="/">Back to website</a>
          </Button>
        </section>
      </main>
    </div>
  );
}
