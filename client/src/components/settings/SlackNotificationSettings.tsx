import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Send, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SlackStatus {
  slack: {
    configured: boolean;
    channel: string | null;
  };
}

const SlackNotificationSettings = () => {
  const { toast } = useToast();
  const [message, setMessage] = useState("Test notification from CloudGuard");
  const [notificationType, setNotificationType] = useState("alert");
  
  // Query Slack configuration status
  const { 
    data: status, 
    isLoading: isStatusLoading,
    refetch: refetchStatus
  } = useQuery<SlackStatus>({
    queryKey: ["/api/notifications/status"],
    queryFn: ({ signal }) => fetch("/api/notifications/status", { signal }).then(res => res.json()),
  });

  // Send test notification
  const testMutation = useMutation({
    mutationFn: async (data: { type: string }) => {
      const response = await apiRequest("POST", "/api/notifications/test", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test notification sent",
        description: "A test notification has been sent to Slack",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send test notification",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Send custom message
  const messageMutation = useMutation({
    mutationFn: async (data: { message: string, type: "simple" | "rich" }) => {
      const response = await apiRequest("POST", "/api/notifications/slack", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent to Slack",
        variant: "default",
      });
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendTestNotification = (type: string) => {
    testMutation.mutate({ type });
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    messageMutation.mutate({
      message,
      type: "simple"
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
          ) : status?.slack.configured ? (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle className="text-emerald-800">Slack is configured</AlertTitle>
              <AlertDescription className="text-emerald-700">
                Notifications will be sent to channel: <Badge variant="outline" className="ml-1 font-mono">{status.slack.channel}</Badge>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Slack is not configured</AlertTitle>
              <AlertDescription>
                Please add the SLACK_BOT_TOKEN and SLACK_CHANNEL_ID environment secrets to enable Slack notifications
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="notificationType">Test notification type</Label>
              <Select
                value={notificationType}
                onValueChange={setNotificationType}
                disabled={!status?.slack.configured || testMutation.isPending}
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
              className="w-full"
              disabled={!status?.slack.configured || testMutation.isPending}
              onClick={() => handleSendTestNotification(notificationType)}
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending test notification...
                </>
              ) : (
                <>
                  Send test notification
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Label htmlFor="message">Custom message</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a message to send to Slack"
                disabled={!status?.slack.configured || messageMutation.isPending}
              />
              <Button
                disabled={!status?.slack.configured || !message.trim() || messageMutation.isPending}
                onClick={handleSendMessage}
              >
                {messageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 flex justify-between">
          <p className="text-sm text-muted-foreground">
            Slack notifications are processed through a secure webhook integration
          </p>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => refetchStatus()}
            disabled={isStatusLoading}
          >
            {isStatusLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh status"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SlackNotificationSettings;