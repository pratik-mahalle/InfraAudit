import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BellRing, ArrowRight, Link2 } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import api from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";

interface SlackNotificationsProps {
  onConfigure?: () => void;
}

export function SlackNotifications({ onConfigure }: SlackNotificationsProps) {
  const { data: preferences } = useNotificationPreferences();

  const { data: historyData } = useQuery<any>({
    queryKey: ["/api/v1/notifications/history", "slack"],
    queryFn: () => api.notifications.getHistory(5, 0),
  });

  const prefs = Array.isArray(preferences) ? preferences : [];
  const slackPref = prefs.find((p: any) => p.channel === "slack");
  const isConnected = slackPref?.is_enabled ?? slackPref?.isEnabled ?? false;

  const logs = (historyData?.logs || []).filter((l: any) => l.channel === "slack");
  const totalAlertsToday = logs.filter((l: any) => {
    const sentAt = l.sent_at || l.sentAt || l.created_at || l.createdAt;
    if (!sentAt) return false;
    const d = new Date(sentAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

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
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
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
              Connect InfraAudit to your Slack workspace to receive real-time alerts
            </p>
            {onConfigure && (
              <Button onClick={onConfigure}>Connect to Slack</Button>
            )}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6">
            <BellRing className="text-slate-400 mb-2 h-10 w-10" />
            <p className="text-slate-500 text-center">No recent Slack notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20">
              <h3 className="font-semibold mb-2">Recent Notifications</h3>
              {logs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="mb-3 last:mb-0">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            log.status === "sent"
                              ? "text-xs bg-emerald-100 text-emerald-700"
                              : log.status === "failed"
                              ? "text-xs bg-red-100 text-red-700"
                              : "text-xs bg-yellow-100 text-yellow-700"
                          }
                        >
                          {log.status}
                        </Badge>
                        <span className="text-sm font-medium">
                          {log.notification_type || log.notificationType || "notification"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(log.sent_at || log.sentAt || log.created_at || log.createdAt)
                          ? formatTimeAgo(log.sent_at || log.sentAt || log.created_at || log.createdAt)
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 text-sm flex justify-between items-center">
              <span>{totalAlertsToday} alerts sent today</span>
              {onConfigure && (
                <Button variant="link" className="text-sm p-0 h-auto" onClick={onConfigure}>
                  Configure <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
