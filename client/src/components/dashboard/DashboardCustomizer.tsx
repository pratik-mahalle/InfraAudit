import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, LayoutDashboard, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";
import type { CustomDashboard, DashboardWidget, DashboardWidgetWidth } from "@/types";
import { useCostAccounts } from "@/hooks/use-costs";
import { Button as PButton } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { FloatLabel } from "primereact/floatlabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "primereact/dialog";
import { DASHBOARD_WIDGET_CATALOG, type DashboardTemplate, widgetLabel } from "./dashboard-config";

interface DashboardCustomizerProps {
  dashboards: CustomDashboard[];
  activeId: string;
  canManage: boolean;
  editing: boolean;
  draftWidgets: DashboardWidget[];
  saving: boolean;
  deleting: boolean;
  onSelect: (id: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (metadata: { name: string; description: string; isDefault: boolean }) => void;
  onDelete: () => void;
  onDraftWidgetsChange: (widgets: DashboardWidget[]) => void;
  onCreate: (input: { name: string; description: string; template: DashboardTemplate }) => void;
}

export function DashboardCustomizer({
  dashboards,
  activeId,
  canManage,
  editing,
  draftWidgets,
  saving,
  deleting,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDraftWidgetsChange,
  onCreate,
}: DashboardCustomizerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<DashboardTemplate>("balanced");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const activeDashboard = dashboards.find((item) => item.id === activeId);
  const accountsQuery = useCostAccounts();
  const accounts = accountsQuery.data?.accounts ?? [];

  useEffect(() => {
    if (!editing) return;
    setEditName(activeDashboard?.name ?? "Cloud Governance Overview");
    setEditDescription(activeDashboard?.description ?? "Security, compliance, inventory, and actual cloud cost evidence.");
    setEditIsDefault(activeDashboard?.isDefault ?? dashboards.length === 0);
  }, [activeDashboard, dashboards.length, editing]);

  const updateWidget = (id: string, update: Partial<DashboardWidget>) => {
    onDraftWidgetsChange(draftWidgets.map((widget) => widget.id === id ? { ...widget, ...update } : widget));
  };

  const moveWidget = (id: string, direction: -1 | 1) => {
    const sorted = [...draftWidgets].sort((a, b) => a.position - b.position);
    const current = sorted.findIndex((widget) => widget.id === id);
    const target = current + direction;
    if (current < 0 || target < 0 || target >= sorted.length) return;
    [sorted[current], sorted[target]] = [sorted[target], sorted[current]];
    onDraftWidgetsChange(sorted.map((widget, position) => ({ ...widget, position })));
  };

  const dropWidgetAt = (targetID: string) => {
    if (!draggedWidgetId || draggedWidgetId === targetID) return;
    const sorted = [...draftWidgets].sort((a, b) => a.position - b.position);
    const draggedIndex = sorted.findIndex((widget) => widget.id === draggedWidgetId);
    const targetIndex = sorted.findIndex((widget) => widget.id === targetID);
    if (draggedIndex < 0 || targetIndex < 0) return;
    const [dragged] = sorted.splice(draggedIndex, 1);
    sorted.splice(targetIndex, 0, dragged);
    onDraftWidgetsChange(sorted.map((widget, position) => ({ ...widget, position })));
    setDraggedWidgetId(null);
  };

  const submitCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), template });
    setCreateOpen(false);
    setName("");
    setDescription("");
    setTemplate("balanced");
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown value={activeId} onChange={(event) => onSelect(event.value)} options={dashboards.map((dashboard) => ({ label: `${dashboard.name}${dashboard.isDefault ? " · default" : ""}`, value: dashboard.id }))} placeholder="Cloud Governance Overview" className="min-w-[220px]" />
        {canManage && <PButton outlined size="small" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create dashboard</PButton>}
        {canManage && <PButton outlined size="small" onClick={onStartEdit}><Pencil className="mr-2 h-4 w-4" /> Edit dashboard</PButton>}
      </div>

      <Dialog visible={createOpen} onHide={() => setCreateOpen(false)} header="Create dashboard" modal className="w-[min(92vw,36rem)]" footer={<div className="flex justify-end gap-2"><PButton text onClick={() => setCreateOpen(false)}>Cancel</PButton><PButton onClick={submitCreate} disabled={!name.trim() || saving}>Create dashboard</PButton></div>}>
        <p className="mb-5 text-sm text-muted-foreground">Start from a curated layout, then tune widgets and cost charts for your organization.</p>
        <div className="flex flex-col gap-5 py-2">
          <FloatLabel><InputText id="dashboard-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} className="w-full" autoFocus /><label htmlFor="dashboard-name">Name</label></FloatLabel>
          <FloatLabel><InputTextarea id="dashboard-description" value={description} maxLength={280} onChange={(event) => setDescription(event.target.value)} className="w-full" rows={3} /><label htmlFor="dashboard-description">Description</label></FloatLabel>
          <FloatLabel><Dropdown inputId="dashboard-template" value={template} onChange={(event) => setTemplate(event.value as DashboardTemplate)} options={[{ label: "Balanced governance", value: "balanced" }, { label: "Cost control", value: "cost" }]} className="w-full" /><label htmlFor="dashboard-template">Template</label></FloatLabel>
        </div>
      </Dialog>

      <Sheet open={editing} onOpenChange={(open) => !open && onCancelEdit()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit {activeDashboard?.name ?? "Cloud Governance Overview"}</SheetTitle>
            <SheetDescription>Rename the view, choose visible widgets, drag their order, and tune the Cost Explorer presentation your team should see.</SheetDescription>
          </SheetHeader>
          <div className="my-6 space-y-5">
            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div className="space-y-2"><Label htmlFor="dashboard-edit-name">Dashboard name</Label><Input id="dashboard-edit-name" value={editName} maxLength={80} onChange={(event) => setEditName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="dashboard-edit-description">Description</Label><Textarea id="dashboard-edit-description" value={editDescription} maxLength={280} onChange={(event) => setEditDescription(event.target.value)} /></div>
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                <div><div className="flex items-center gap-2 text-sm font-medium"><Star className="h-4 w-4" /> Organization default</div><p className="mt-1 text-xs text-muted-foreground">Open this dashboard first for every organization member.</p></div>
                <Switch checked={editIsDefault} onCheckedChange={setEditIsDefault} aria-label="Use as organization default dashboard" />
              </div>
            </div>
            <div>
              <div className="mb-3"><h3 className="text-sm font-semibold">Widget canvas</h3><p className="text-xs text-muted-foreground">Drag the grip to reorder. Arrow controls remain available for keyboard editing.</p></div>
            {[...draftWidgets].sort((a, b) => a.position - b.position).map((widget, index, ordered) => {
              const catalog = DASHBOARD_WIDGET_CATALOG.find((item) => item.type === widget.type);
              const visibleAccounts = accounts.filter((account) => !widget.config?.provider || widget.config.provider === "all" || account.provider === widget.config.provider);
              return (
                <div key={widget.id} className={`mb-3 rounded-xl border bg-card p-4 transition ${draggedWidgetId === widget.id ? "border-primary/70 opacity-60 shadow-lg" : "hover:border-primary/30"}`} onDragOver={(event) => event.preventDefault()} onDrop={() => dropWidgetAt(widget.id)}>
                  <div className="flex items-start gap-3">
                    <button type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", widget.id); setDraggedWidgetId(widget.id); }} onDragEnd={() => setDraggedWidgetId(null)} className="mt-0.5 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing" aria-label={`Drag ${widgetLabel(widget.type)} to reorder`} aria-grabbed={draggedWidgetId === widget.id}><GripVertical className="h-4 w-4" /></button>
                    <Switch checked={widget.visible} onCheckedChange={(visible) => updateWidget(widget.id, { visible })} aria-label={`Show ${widgetLabel(widget.type)}`} />
                    <div className="min-w-0 flex-1"><div className="font-medium">{catalog?.label}</div><p className="text-xs text-muted-foreground">{catalog?.description}</p></div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => moveWidget(widget.id, -1)}><ChevronUp className="h-4 w-4" /><span className="sr-only">Move up</span></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === ordered.length - 1} onClick={() => moveWidget(widget.id, 1)}><ChevronDown className="h-4 w-4" /><span className="sr-only">Move down</span></Button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 pl-[4.75rem]">
                    <Input className="h-8" value={widget.title ?? ""} maxLength={80} onChange={(event) => updateWidget(widget.id, { title: event.target.value })} placeholder={catalog?.label} aria-label={`${catalog?.label} title`} />
                    <Select value={widget.width} onValueChange={(width) => updateWidget(widget.id, { width: width as DashboardWidgetWidth })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="full">Full width</SelectItem><SelectItem value="half">Half width</SelectItem><SelectItem value="third">One third</SelectItem></SelectContent>
                    </Select>
                    {widget.type === "cost_explorer" && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <Select value={widget.config?.visualizationMode ?? "trend"} onValueChange={(visualizationMode) => updateWidget(widget.id, { config: { ...widget.config, visualizationMode: visualizationMode as NonNullable<DashboardWidget["config"]>["visualizationMode"] } })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="trend">Trend over time</SelectItem><SelectItem value="breakdown">Grouped breakdown</SelectItem></SelectContent></Select>
                        {(widget.config?.visualizationMode ?? "trend") === "trend" ? (
                          <Select value={widget.config?.chartType ?? "area"} onValueChange={(chartType) => updateWidget(widget.id, { config: { ...widget.config, chartType: chartType as NonNullable<DashboardWidget["config"]>["chartType"] } })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="area">Area chart</SelectItem><SelectItem value="line">Line chart</SelectItem><SelectItem value="bar">Bar chart</SelectItem></SelectContent></Select>
                        ) : (
                          <Select value={widget.config?.breakdownChartType ?? "bar"} onValueChange={(breakdownChartType) => updateWidget(widget.id, { config: { ...widget.config, breakdownChartType: breakdownChartType as NonNullable<DashboardWidget["config"]>["breakdownChartType"] } })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bar">Horizontal bars</SelectItem><SelectItem value="donut">Donut chart</SelectItem></SelectContent></Select>
                        )}
                        <Select value={widget.config?.timeframe ?? "30d"} onValueChange={(timeframe) => updateWidget(widget.id, { config: { ...widget.config, timeframe: timeframe as NonNullable<DashboardWidget["config"]>["timeframe"] } })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem><SelectItem value="current_month">Current month</SelectItem></SelectContent></Select>
                        <Select value={widget.config?.groupBy ?? "service"} onValueChange={(groupBy) => updateWidget(widget.id, { config: { ...widget.config, groupBy: groupBy as NonNullable<DashboardWidget["config"]>["groupBy"] } })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="service">Group by service</SelectItem><SelectItem value="region">Group by region</SelectItem><SelectItem value="resource">Group by resource</SelectItem></SelectContent></Select>
                        <Select value={widget.config?.provider ?? "all"} onValueChange={(provider) => updateWidget(widget.id, { config: { ...widget.config, provider: provider as NonNullable<DashboardWidget["config"]>["provider"], accountId: undefined } })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All providers</SelectItem><SelectItem value="aws">AWS</SelectItem><SelectItem value="gcp">GCP</SelectItem><SelectItem value="azure">Azure</SelectItem></SelectContent></Select>
                        <Select value={widget.config?.accountId ?? "all"} onValueChange={(accountId) => updateWidget(widget.id, { config: { ...widget.config, accountId: accountId === "all" ? undefined : accountId } })}><SelectTrigger className="h-8"><SelectValue placeholder="All cloud accounts" /></SelectTrigger><SelectContent><SelectItem value="all">All cloud accounts</SelectItem>{visibleAccounts.map((account) => <SelectItem key={`${account.provider}:${account.cloudAccountId}`} value={account.cloudAccountId}>{account.cloudAccountId} · {account.provider.toUpperCase()}</SelectItem>)}</SelectContent></Select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
          <SheetFooter className="gap-2 sm:justify-between">
            <div>{activeDashboard && <Button variant="destructive" onClick={onDelete} disabled={deleting}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>}</div>
            <div className="flex gap-2"><Button variant="outline" onClick={onCancelEdit}>Cancel</Button><Button onClick={() => onSave({ name: editName.trim(), description: editDescription.trim(), isDefault: editIsDefault })} disabled={saving || !editName.trim() || !draftWidgets.some((widget) => widget.visible)}><Save className="mr-2 h-4 w-4" /> Save dashboard</Button></div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
