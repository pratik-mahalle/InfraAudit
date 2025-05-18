import React from "react";
import { cn } from "@/lib/utils";
import { 
  ShieldX, 
  TriangleAlert, 
  Server, 
  Bell, 
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: "security" | "cost" | "resources" | "alerts";
  status?: "healthy" | "warning" | "critical";
  timeframe?: string;
  actionLink?: string;
  actionText?: string;
  isLoading?: boolean;
}

export function StatusCard({
  title,
  value,
  description,
  icon,
  status = "healthy",
  timeframe = "Last 24 hours",
  actionLink = "#",
  actionText = "View details",
  isLoading = false,
}: StatusCardProps) {
  const getIconColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-danger";
      case "warning":
        return "text-warning";
      default:
        return icon === "resources" ? "text-primary" : "text-secondary";
    }
  };

  const getBgColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-danger bg-opacity-10";
      case "warning":
        return "bg-warning bg-opacity-10";
      default:
        return icon === "resources" ? "bg-primary bg-opacity-10" : "bg-secondary bg-opacity-10";
    }
  };

  const getIcon = () => {
    switch (icon) {
      case "security":
        return <ShieldX className={cn("text-xl", getIconColor(status))} />;
      case "cost":
        return <TriangleAlert className={cn("text-xl", getIconColor(status))} />;
      case "resources":
        return <Server className={cn("text-xl", getIconColor(status))} />;
      case "alerts":
        return <Bell className={cn("text-xl", getIconColor(status))} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-sm">{title}</span>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <span 
              className={cn(
                "font-semibold text-xl mt-1 font-inter",
                status === "critical" && "text-danger",
                status === "warning" && "text-warning"
              )}
            >
              {value}
            </span>
          )}
        </div>
        <div className={cn("rounded-full p-2", getBgColor(status))}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            getIcon()
          )}
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-4 w-full mb-3" />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">{timeframe}</span>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <a href={actionLink} className="text-primary text-sm font-medium hover:underline">
            {actionText}
          </a>
        )}
      </div>
    </div>
  );
}
