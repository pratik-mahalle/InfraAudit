import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Send, BellRing, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationPreferences, useUpdatePreference, useSendTestNotification } from "@/hooks/use-notifications";

const SlackNotificationSettings = () => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notificationType, setNotificationType] = useState("alert");

  const { data: preferences, isLoading: isStatusLoading } = useNotificationPreferences();
  const { mutate: updatePreference, isPending: isSaving } = useUpdatePreference();
  const { mutate: testNotification, isPending: isTesting } = useSendTestNotification();

  // Parse Slack preference from backend
  const prefs = Array.isArray(preferences) ? preferences : [];
  const slackPref = prefs.find((p: any) => p.channel === "slack");
  const isEnabled = slackPref?.is_enabled ?? slackPref?.isEnabled ?? false;
  const hasWebhook = !!(slackPref?.config?.webhook_url || slackPref?.config?.webhookUrl);
  const isConfigured = isEnabled && hasWebhook;

  useEffect(() => {
    if (slackPref?.config?.webhook_url) {
      setWebhookUrl(slackPref.config.webhook_url);
    } else if (slackPref?.config?.webhookUrl) {
      setWebhookUrl(slackPref.config.webhookUrl);
    }
  }, [slackPref]);

  const handleSaveWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({ title: "Webhook URL required", description: "Enter a Slack webhook URL.", variant: "destructive" });
      return;
    }
    updatePreference({
      channel: "slack",
      settings: { enabled: true, webhook_url: webhookUrl.trim() },
    }, {
      onSuccess: () => toast({ title: "Saved", description: "Slack webhook URL configured." }),
      onError: () => toast({ title: "Failed", description: "Could not save Slack configuration.", variant: "destructive" }),
    });
  };

  const handleSendTest = () => {
    const typeLabels: Record<string, string> = {
      alert: "Alert notification",
      security: "Security drift notification",
      cost: "Cost anomaly notification",
    };
    testNotification({
      channel: "slack",
      message: `Test ${typeLabels[notificationType] || notificationType} from InfraAudit`,
    }, {
      onSuccess: () => toast({ title: "Test sent", description: "Test notification queued for Slack." }),
      onError: (err: any) => toast({ title: "Failed", description: err?.message || "Could not send test.", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Slack Notifications
          </CardTitle>
          <CardDescription>
            Configure and test Slack notifications for alerts, security drifts, and cost anomalies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isStatusLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isConfigured ? (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">Slack is configured</AlertTitle>
              <AlertDescription className="text-emerald-700">
                Notifications will be sent via your configured webhook
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Slack is not configured</AlertTitle>
              <AlertDescription>
                Enter your Slack Incoming Webhook URL below to enable notifications
              </AlertDescription>
            </Alert>
          )}

          {/* Webhook URL */}
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button onClick={handleSaveWebhook} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Test notification */}
            <div>
              <Label htmlFor="notificationType">Test notification type</Label>
              <Select
                value={notificationType}
                onValueChange={setNotificationType}
                disabled={!isConfigured || isTesting}
              >
                <SelectTrigger id="notificationType" className="mt-1.5">
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alert">Alert notification</SelectItem>
                  <SelectItem value="security">Security drift notification</SelectItem>
                  <SelectItem value="cost">Cost anomaly notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={!isConfigured || isTesting}
              onClick={handleSendTest}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send test notification
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Slack notifications are delivered via incoming webhooks
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SlackNotificationSettings;
