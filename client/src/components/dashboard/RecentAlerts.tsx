import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import { Alert } from "@/types";
import { Link } from "wouter";

interface RecentAlertsProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export function RecentAlerts({ alerts, isLoading = false }: RecentAlertsProps) {
  const getSeverityBorderColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "border-danger";
      case "high":
        return "border-warning";
      case "medium":
        return "border-amber-500";
      case "low":
        return "border-secondary";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">Recent Alerts</CardTitle>
        <Link href="/alerts">
          <a className="text-primary text-sm hover:underline">View all</a>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-l-4 border-gray-300 pl-3 py-2">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-4 w-[40px]" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-[80px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              </div>
            ))
          ) : alerts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No alerts to display.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 ${getSeverityBorderColor(
                  alert.severity
                )} pl-3 py-2`}
              >
                <div className="flex justify-between mb-1">
                  <h3 className="text-sm font-medium">{alert.title}</h3>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(alert.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{alert.message}</p>
                <div className="flex space-x-2">
                  {alert.type === "cost" && (
                    <Button size="sm" variant="default" className="text-xs h-8">
                      Investigate
                    </Button>
                  )}
                  {alert.type === "security" && (
                    <Button size="sm" variant="default" className="text-xs h-8">
                      {alert.message.includes("policy") ? "Review" : "Fix Now"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 bg-gray-100 text-gray-500"
                  >
                    {alert.type === "cost" ? "Snooze" : alert.message.includes("policy") ? "Dismiss" : "Approve"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
