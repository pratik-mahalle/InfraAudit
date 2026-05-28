import { useNotificationPreferences } from "@/hooks/use-notifications";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

interface NotificationChannelsProps {
  onConfigure?: () => void;
}

export function NotificationChannels({ onConfigure }: NotificationChannelsProps) {
  const { data: preferences, isLoading: isLoadingPrefs } = useNotificationPreferences();

  const { data: historyData, isLoading: isLoadingHistory } = useQuery<any>({
    queryKey: ["/api/v1/notifications/history"],
    queryFn: () => api.notifications.getHistory(10, 0),
  });

  const isLoading = isLoadingPrefs || isLoadingHistory;

  // Parse preferences
  const prefs = Array.isArray(preferences) ? preferences : [];
  const slackPref = prefs.find((p: any) => p.channel === "slack");
  const emailPref = prefs.find((p: any) => p.channel === "email");

  const slackEnabled = slackPref?.is_enabled ?? slackPref?.isEnabled ?? false;
  const emailEnabled = emailPref?.is_enabled ?? emailPref?.isEnabled ?? false;

  // Parse recent logs
  const logs = historyData?.logs || [];
  const sentCount = logs.filter((l: any) => l.status === "sent").length;
  const failedCount = logs.filter((l: any) => l.status === "failed").length;

  if (isLoading) {
    return (
      <Card className="border border-gray-200/60 dark:border-slate-800/60">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/60 dark:border-slate-800/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-500" />
            Notification Channels
          </CardTitle>
          {onConfigure && (
            <Button variant="ghost" size="sm" onClick={onConfigure} className="gap-1 text-xs">
              Configure <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Slack channel */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="bg-[#4A154B] p-2 rounded-lg">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Slack</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {slackEnabled ? "Webhook configured" : "Not configured"}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              slackEnabled
                ? "text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "text-xs bg-gray-500/10 text-gray-500 border-gray-500/30"
            }
          >
            {slackEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Email channel */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Email</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {emailEnabled ? "Recipients configured" : "Not configured"}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              emailEnabled
                ? "text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "text-xs bg-gray-500/10 text-gray-500 border-gray-500/30"
            }
          >
            {emailEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Recent activity summary */}
        {logs.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Recent: {sentCount} sent{failedCount > 0 ? `, ${failedCount} failed` : ""}
              </span>
              {onConfigure && (
                <button
                  onClick={onConfigure}
                  className="text-primary hover:underline"
                >
                  View history
                </button>
              )}
            </div>
          </div>
        )}

        {/* No channels configured prompt */}
        {!slackEnabled && !emailEnabled && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No notification channels configured
            </p>
            {onConfigure && (
              <Button variant="outline" size="sm" onClick={onConfigure}>
                Set up notifications
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Keep backward-compatible export for existing imports
export function SlackNotifications({
  isConnected = false,
  alertsSentToday = 0,
}: {
  isConnected?: boolean;
  alertsSentToday?: number;
}) {
  return <NotificationChannels />;
}
