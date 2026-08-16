import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import {
  useCostNotificationChannels,
  useTestCostNotificationChannel,
  useUpdateCostNotificationChannel,
} from "@/hooks/use-cost-notifications";
import type { CostNotificationChannelType } from "@/types";

function recipientsFromInput(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

export function CostNotificationChannels() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("manage_billing");
  const channelsQuery = useCostNotificationChannels();
  const updateChannel = useUpdateCostNotificationChannel();
  const testChannel = useTestCostNotificationChannel();
  const channels = channelsQuery.data?.channels ?? [];
  const slack = channels.find((channel) => channel.channel === "slack");
  const email = channels.find((channel) => channel.channel === "email");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");

  const enabledCount = useMemo(() => channels.filter((channel) => channel.enabled && channel.deliveryReady).length, [channels]);
  const reportError = (error: unknown) => toast({
    title: "Notification channel needs attention",
    description: error instanceof Error ? error.message : "The channel could not be updated.",
    variant: "destructive",
  });

  const saveSlack = () => {
    if (!slack?.configured && !slackWebhook.trim()) {
      reportError(new Error("Enter a Slack incoming webhook URL first."));
      return;
    }
    updateChannel.mutate({ channel: "slack", input: { enabled: true, webhookUrl: slackWebhook.trim() || undefined } }, {
      onSuccess: () => {
        setSlackWebhook("");
        toast({ title: "Slack enabled", description: "The webhook was stored encrypted and will receive new breach transitions." });
      },
      onError: reportError,
    });
  };

  const saveEmail = () => {
    const recipients = recipientsFromInput(emailRecipients);
    if (!email?.configured && recipients.length === 0) {
      reportError(new Error("Enter at least one email recipient."));
      return;
    }
    updateChannel.mutate({ channel: "email", input: { enabled: true, recipients: recipients.length > 0 ? recipients : undefined } }, {
      onSuccess: () => {
        setEmailRecipients("");
        toast({ title: "Email enabled", description: recipients.length > 0 ? `${recipients.length} recipient${recipients.length === 1 ? "" : "s"} will receive new breach transitions.` : "The stored recipient list is active." });
      },
      onError: reportError,
    });
  };

  const toggleChannel = (channel: CostNotificationChannelType, enabled: boolean) => {
    const current = channel === "slack" ? slack : email;
    if (enabled && !current?.configured) {
      reportError(new Error(`Configure ${channel === "slack" ? "a Slack webhook" : "email recipients"} before enabling delivery.`));
      return;
    }
    updateChannel.mutate({ channel, input: { enabled } }, {
      onSuccess: () => toast({ title: `${channel === "slack" ? "Slack" : "Email"} ${enabled ? "enabled" : "paused"}` }),
      onError: reportError,
    });
  };

  const sendTest = (channel: CostNotificationChannelType) => {
    const input = channel === "slack"
      ? { webhookUrl: slackWebhook.trim() || undefined }
      : { recipients: recipientsFromInput(emailRecipients).length > 0 ? recipientsFromInput(emailRecipients) : undefined };
    testChannel.mutate({ channel, input }, {
      onSuccess: () => toast({ title: "Test delivered", description: `InfraAudit confirmed the ${channel} provider accepted the test.` }),
      onError: reportError,
    });
  };

  if (channelsQuery.isLoading) {
    return <Card><CardHeader><Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4" />Breach delivery channels</CardTitle>
            <CardDescription className="mt-1">Organization-wide Slack and email routing for new warnings, critical escalations, and recovery events.</CardDescription>
          </div>
          <Badge variant={enabledCount > 0 ? "outline" : "secondary"}>{enabledCount} active channel{enabledCount === 1 ? "" : "s"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {channelsQuery.isError && (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Channel health could not be loaded</AlertTitle><AlertDescription>Monitor evaluation continues, but external delivery status is unknown. <Button variant="link" className="h-auto p-0" onClick={() => channelsQuery.refetch()}>Retry</Button></AlertDescription></Alert>
        )}
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Secrets remain server-side</AlertTitle>
          <AlertDescription>Slack webhook and recipient configuration are encrypted at rest. Saved destinations are never returned to the browser or written to delivery history.</AlertDescription>
        </Alert>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChannelCard
            icon={<MessageSquare className="h-5 w-5 text-violet-600" />}
            title="Slack"
            description="Immediate messages to a Slack incoming webhook."
            configured={Boolean(slack?.configured)}
            deliveryReady={Boolean(slack?.deliveryReady)}
            issue={slack?.issue}
            enabled={Boolean(slack?.enabled)}
            hint={slack?.destinationHint}
            canManage={canManage}
            busy={updateChannel.isPending || testChannel.isPending}
            onToggle={(enabled) => toggleChannel("slack", enabled)}
          >
            <div className="space-y-2">
              <Label htmlFor="cost-slack-webhook">Incoming webhook URL</Label>
              <Input id="cost-slack-webhook" type="password" autoComplete="off" placeholder={slack?.configured ? "Stored securely — enter only to replace" : "https://hooks.slack.com/services/..."} value={slackWebhook} onChange={(event) => setSlackWebhook(event.target.value)} disabled={!canManage} />
            </div>
            {canManage && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={saveSlack} disabled={updateChannel.isPending}>{updateChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save and enable</Button><Button size="sm" variant="outline" onClick={() => sendTest("slack")} disabled={testChannel.isPending || (!slack?.configured && !slackWebhook.trim())}>Send test</Button></div>}
          </ChannelCard>

          <ChannelCard
            icon={<Mail className="h-5 w-5 text-blue-600" />}
            title="Email"
            description="One message to every configured FinOps recipient."
            configured={Boolean(email?.configured)}
            deliveryReady={Boolean(email?.deliveryReady)}
            issue={email?.issue}
            enabled={Boolean(email?.enabled)}
            hint={email?.destinationHint}
            canManage={canManage}
            busy={updateChannel.isPending || testChannel.isPending}
            onToggle={(enabled) => toggleChannel("email", enabled)}
          >
            <div className="space-y-2">
              <Label htmlFor="cost-email-recipients">Recipients</Label>
              <Input id="cost-email-recipients" type="text" placeholder={email?.configured ? "Stored securely — enter only to replace" : "finops@example.com, owner@example.com"} value={emailRecipients} onChange={(event) => setEmailRecipients(event.target.value)} disabled={!canManage} />
              <p className="text-xs text-muted-foreground">Comma-separated; duplicates are removed by the server and saved addresses are never returned.</p>
            </div>
            {canManage && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={saveEmail} disabled={updateChannel.isPending}>{updateChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save and enable</Button><Button size="sm" variant="outline" onClick={() => sendTest("email")} disabled={testChannel.isPending || (!email?.configured && recipientsFromInput(emailRecipients).length === 0)}>Send test</Button></div>}
          </ChannelCard>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChannelCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  configured: boolean;
  deliveryReady: boolean;
  issue?: string;
  enabled: boolean;
  hint?: string;
  canManage: boolean;
  busy: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}

function ChannelCard({ icon, title, description, configured, deliveryReady, issue, enabled, hint, canManage, busy, onToggle, children }: ChannelCardProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2">{icon}</div>
          <div><p className="font-semibold">{title}</p><p className="text-xs text-muted-foreground">{description}</p></div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={!canManage || busy || !configured} aria-label={`Enable ${title} cost notifications`} />
      </div>
      <div className="flex items-center gap-2 text-xs">
        {configured ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <KeyRound className="h-4 w-4 text-muted-foreground" />}
        <span className={configured ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}>{configured ? hint || "Configured" : "Not configured"}</span>
        <Badge variant="outline" className="ml-auto">{enabled && deliveryReady ? "active" : enabled ? "setup required" : "paused"}</Badge>
      </div>
      {issue && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Delivery setup required</AlertTitle><AlertDescription>{issue}</AlertDescription></Alert>}
      {children}
    </div>
  );
}
