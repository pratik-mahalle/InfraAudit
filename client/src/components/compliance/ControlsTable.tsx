import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceControl } from '@/types';
import { Eye, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ControlsTableProps {
    controls: ComplianceControl[];
    isLoading: boolean;
    onView: (control: ComplianceControl) => void;
    selectedId?: string | null;
}

export function ControlsTable({ controls, isLoading, onView, selectedId }: ControlsTableProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (controls.length === 0) {
        return (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                <ShieldCheck className="mb-3 h-6 w-6" />
                <p className="text-sm font-medium text-foreground">No controls found</p>
                <p className="mt-1 text-sm">Select another framework or enable controls for this framework.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {controls.map((control) => {
                const isSelected = selectedId === control.id;
                return (
                    <button
                        key={control.id}
                        type="button"
                        onClick={() => onView(control)}
                        className={cn(
                            "group rounded-lg border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40",
                            isSelected && "border-primary/50 bg-primary/5",
                        )}
                    >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-primary">{control.controlId}</span>
                                    <Badge variant="outline">{control.category}</Badge>
                                    <Badge variant={
                                        control.severity === 'critical' ? 'destructive' :
                                            control.severity === 'high' ? 'default' :
                                                'secondary'
                                    }>
                                        {control.severity}
                                    </Badge>
                                </div>
                                <h3 className="mt-2 line-clamp-1 text-sm font-semibold">{control.title}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{control.description}</p>
                            </div>
                            <Button
                                type="button"
                                variant={isSelected ? "secondary" : "outline"}
                                size="sm"
                                className="shrink-0 gap-2"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onView(control);
                                }}
                            >
                                <Eye className="h-4 w-4" />
                                Review
                            </Button>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
