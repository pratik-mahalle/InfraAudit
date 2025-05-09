import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutGrid, 
  Sparkles, 
  BarChart3, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Gauge, 
  PlusCircle,
  X, 
  GripVertical,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type WidgetType = 
  | "cost-anomalies" 
  | "security-threats" 
  | "resource-utilization" 
  | "optimization-opportunities"
  | "provider-overview"
  | "alerts-summary";

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: "high" | "medium" | "low";
  added: boolean;
}

export function PersonalizedWidgets() {
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [addedWidgets, setAddedWidgets] = useState<Widget[]>([]);

  // Fetch user preferences (in a real app, this would come from the backend)
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ["/api/user-preferences"],
    queryFn: () => {
      // Mock response
      return {
        preferredWidgets: ["cost-anomalies", "security-threats"],
        dashboardLayout: "compact"
      };
    }
  });

  // Available widgets with recommendations
  const availableWidgets: Widget[] = [
    {
      id: "w1",
      type: "cost-anomalies",
      title: "Cost Anomalies",
      description: "Detect unusual spending patterns across your cloud infrastructure",
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
      priority: "high",
      added: addedWidgets.some(w => w.id === "w1")
    },
    {
      id: "w2",
      type: "security-threats",
      title: "Security Threats",
      description: "Real-time detection of potential security vulnerabilities",
      icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
      priority: "high",
      added: addedWidgets.some(w => w.id === "w2")
    },
    {
      id: "w3",
      type: "resource-utilization",
      title: "Resource Utilization",
      description: "Monitor CPU, memory, and storage usage across your resources",
      icon: <Gauge className="h-5 w-5 text-green-500" />,
      priority: "medium",
      added: addedWidgets.some(w => w.id === "w3")
    },
    {
      id: "w4",
      type: "optimization-opportunities",
      title: "Optimization Opportunities",
      description: "Identify cost-saving opportunities in your infrastructure",
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      priority: "medium",
      added: addedWidgets.some(w => w.id === "w4")
    },
    {
      id: "w5",
      type: "provider-overview",
      title: "Cloud Provider Overview",
      description: "View resource distribution across different cloud providers",
      icon: <LayoutGrid className="h-5 w-5 text-indigo-500" />,
      priority: "low",
      added: addedWidgets.some(w => w.id === "w5")
    },
    {
      id: "w6",
      type: "alerts-summary",
      title: "Alerts Summary",
      description: "Overview of recent alerts from all monitored resources",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      priority: "low",
      added: addedWidgets.some(w => w.id === "w6")
    }
  ];

  const handleAddWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsConfirmOpen(true);
  };

  const confirmAddWidget = () => {
    if (selectedWidget) {
      setAddedWidgets([...addedWidgets, selectedWidget]);
      setIsConfirmOpen(false);
      toast({
        title: "Widget added",
        description: `${selectedWidget.title} has been added to your dashboard.`,
      });
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    setAddedWidgets(addedWidgets.filter(w => w.id !== widgetId));
    toast({
      title: "Widget removed",
      description: "The widget has been removed from your dashboard.",
    });
  };

  // Filter for recommended (high priority) widgets
  const recommendedWidgets = availableWidgets.filter(w => w.priority === "high" && !w.added);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Personalized Widgets</h2>
          <p className="text-muted-foreground">Add custom widgets to enhance your monitoring experience</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Widget
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <DropdownMenuLabel>Available Widgets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableWidgets.filter(w => !w.added).map(widget => (
                <DropdownMenuItem 
                  key={widget.id}
                  onClick={() => handleAddWidget(widget)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="shrink-0">{widget.icon}</span>
                  <div className="flex flex-col">
                    <span>{widget.title}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {widget.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recommendations section */}
      {recommendedWidgets.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium">Recommended for you</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedWidgets.map(widget => (
              <div 
                key={widget.id}
                className="bg-white dark:bg-gray-800/60 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-start gap-3"
              >
                <div className="shrink-0 mt-0.5">
                  {widget.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{widget.title}</h4>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 h-8 text-xs text-blue-600 dark:text-blue-400 p-0"
                    onClick={() => handleAddWidget(widget)}
                  >
                    Add to dashboard
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Added widgets section */}
      {addedWidgets.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Your Custom Widgets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addedWidgets.map(widget => (
              <Card key={widget.id} className="border border-border/60">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <span className="shrink-0">{widget.icon}</span>
                    {widget.title}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => handleRemoveWidget(widget.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{widget.description}</p>
                </CardContent>
                <CardFooter className="border-t border-border/40 pt-2 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Drag to reposition</span>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {addedWidgets.length === 0 && recommendedWidgets.length === 0 && (
        <div className="bg-muted/40 rounded-lg border border-border p-6 text-center">
          <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-lg mb-2">No widgets added yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Customize your dashboard by adding widgets that provide insights relevant to your infrastructure.
          </p>
          <Button onClick={() => {}}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add your first widget
          </Button>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add widget to dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedWidget?.title} will be added to your personalized dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddWidget}>Add Widget</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}