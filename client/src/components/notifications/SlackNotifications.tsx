import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellRing, ArrowRight, Link2 } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

interface SlackAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface SlackNotificationsProps {
  isConnected?: boolean;
  alerts?: SlackAlert[];
  totalAlertsToday?: number;
  onConfigure?: () => void;
}

export function SlackNotifications({
  isConnected = false,
  alerts = [],
  totalAlertsToday = 0,
  onConfigure
}: SlackNotificationsProps) {
  // Function to get severity colors
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "text-red-700 bg-red-100";
      case "high":
        return "text-orange-700 bg-orange-100";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      case "low":
        return "text-blue-700 bg-blue-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-[#4A154B] p-1 rounded">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="white"
            >
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
          </div>
          <div>
            <CardTitle>Slack Notifications</CardTitle>
            <CardDescription>
              {isConnected ? "Connected" : "Not connected"}
            </CardDescription>
          </div>
        </div>
        {onConfigure && (
          <Button variant="ghost" size="sm" onClick={onConfigure}>
            Configure
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Link2 className="text-slate-400 mb-2 h-10 w-10" />
            <p className="text-slate-500 text-center mb-4">
              Connect CloudGuard to your Slack workspace to receive real-time alerts
            </p>
            <Button>Connect to Slack</Button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6">
            <BellRing className="text-slate-400 mb-2 h-10 w-10" />
            <p className="text-slate-500 text-center">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="divide-y">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20">
              <h3 className="font-semibold mb-2">CloudGuard Alerts</h3>
              {alerts.map((alert) => (
                <div key={alert.id} className="mb-4 last:mb-0">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {alert.severity === "critical" && (
                          <span className="text-red-500 text-xl">🚨</span>
                        )}
                        <span className="font-medium">
                          {alert.severity === "critical" && "Critical Alert: "}
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="link" className="p-0 h-auto text-sm text-blue-500 hover:text-blue-700">
                          View details <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        <span className="text-xs text-slate-500">
                          {alert.timestamp ? formatTimeAgo(alert.timestamp) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 text-sm flex justify-between items-center">
              <span>{totalAlertsToday} alerts sent today</span>
              <Button variant="link" className="text-sm p-0 h-auto">
                Configure
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}