import type { DashboardWidget, DashboardWidgetType } from "@/types";

export const DASHBOARD_WIDGET_CATALOG: Array<{
  type: DashboardWidgetType;
  label: string;
  description: string;
  defaultWidth: DashboardWidget["width"];
}> = [
  { type: "kpis", label: "Governance KPIs", description: "Health, resources, drift, alerts, and compliance at a glance.", defaultWidth: "full" },
  { type: "inventory", label: "Resource inventory", description: "Live resource counts, types, regions, and availability.", defaultWidth: "full" },
  { type: "cost_explorer", label: "Cost Explorer", description: "Configurable actual-cost area, line, or bar chart.", defaultWidth: "half" },
  { type: "drift_feed", label: "Drift feed", description: "Most recent infrastructure drift findings.", defaultWidth: "half" },
  { type: "cost_monitors", label: "Cost monitors", description: "Budget and spend guardrail health for the selected scope.", defaultWidth: "full" },
  { type: "compliance", label: "Compliance posture", description: "Control coverage and framework pass rates.", defaultWidth: "third" },
  { type: "findings", label: "Unified findings", description: "Open and high-risk normalized findings.", defaultWidth: "third" },
  { type: "savings", label: "Optimization opportunities", description: "Evidence-backed savings recommendations.", defaultWidth: "third" },
  { type: "drift_table", label: "Open drifts", description: "Detailed infrastructure drift triage table.", defaultWidth: "full" },
];

export type DashboardTemplate = "balanced" | "cost";

export function dashboardWidgetsForTemplate(template: DashboardTemplate = "balanced"): DashboardWidget[] {
  const enabledTypes: DashboardWidgetType[] = template === "cost"
    ? ["kpis", "cost_explorer", "cost_monitors", "savings"]
    : DASHBOARD_WIDGET_CATALOG.map((item) => item.type);

  return DASHBOARD_WIDGET_CATALOG.map((item, position) => ({
    id: item.type,
    type: item.type,
    position,
    width: item.defaultWidth,
    visible: enabledTypes.includes(item.type),
    config: item.type === "cost_explorer" ? {
      chartType: "area",
      timeframe: "30d",
      groupBy: "service",
      provider: "all",
    } : undefined,
  }));
}

export function cloneDashboardWidgets(widgets: DashboardWidget[]) {
  return widgets.map((widget) => ({ ...widget, config: widget.config ? { ...widget.config } : undefined }));
}

export function widgetLabel(type: DashboardWidgetType) {
  return DASHBOARD_WIDGET_CATALOG.find((item) => item.type === type)?.label ?? type;
}
