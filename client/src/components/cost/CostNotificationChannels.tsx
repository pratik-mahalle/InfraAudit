import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, KeyRound, Loader2, Mail, MessageSquare, Send, ShieldCheck, Webhook } from "lucide-react";
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
  useCostNotificationEscalationPolicy,
  useTestCostNotificationChannel,
  useUpdateCostNotificationChannel,
  useUpdateCostNotificationEscalationPolicy,
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
  const policyQuery = useCostNotificationEscalationPolicy();
  const updatePolicy = useUpdateCostNotificationEscalationPolicy();
  const channels = channelsQuery.data?.channels ?? [];
  const slack = channels.find((channel) => channel.channel === "slack");
  const email = channels.find((channel) => channel.channel === "email");
  const webhook = channels.find((channel) => channel.channel === "webhook");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [webhookURL, setWebhookURL] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [policyDraft, setPolicyDraft] = useState<Partial<{ escalateAfterHours: number; repeatEveryHours: number; maxEscalationLevel: number }>>({});

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

  const saveWebhook = () => {
    if (!webhook?.configured && (!webhookURL.trim() || !webhookSecret.trim())) {
      reportError(new Error("Enter an HTTPS endpoint and a signing secret of at least 32 characters."));
      return;
    }
    updateChannel.mutate({ channel: "webhook", input: { enabled: true, webhookUrl: webhookURL.trim() || undefined, signingSecret: webhookSecret.trim() || undefined } }, {
      onSuccess: () => {
        setWebhookURL("");
        setWebhookSecret("");
        toast({ title: "Signed webhook enabled", description: "InfraAudit will sign every breach event and record each delivery attempt." });
      },
      onError: reportError,
    });
  };

  const toggleChannel = (channel: CostNotificationChannelType, enabled: boolean) => {
    const current = channel === "slack" ? slack : channel === "email" ? email : webhook;
    if (enabled && !current?.configured) {
      reportError(new Error(`Configure ${channel === "slack" ? "a Slack webhook" : channel === "email" ? "email recipients" : "a signed webhook"} before enabling delivery.`));
      return;
    }
    updateChannel.mutate({ channel, input: { enabled } }, {
      onSuccess: () => toast({ title: `${channel === "slack" ? "Slack" : channel === "email" ? "Email" : "Webhook"} ${enabled ? "enabled" : "paused"}` }),
      onError: reportError,
    });
  };

  const sendTest = (channel: CostNotificationChannelType) => {
    const input = channel === "slack"
      ? { webhookUrl: slackWebhook.trim() || undefined }
      : channel === "email"
        ? { recipients: recipientsFromInput(emailRecipients).length > 0 ? recipientsFromInput(emailRecipients) : undefined }
        : { webhookUrl: webhookURL.trim() || undefined, signingSecret: webhookSecret.trim() || undefined };
    testChannel.mutate({ channel, input }, {
      onSuccess: () => toast({ title: "Test delivered", description: `InfraAudit confirmed the ${channel} provider accepted the test.` }),
      onError: reportError,
    });
  };

  const escalationPolicy = {
    enabled: policyQuery.data?.enabled ?? false,
    escalateAfterHours: policyDraft.escalateAfterHours ?? policyQuery.data?.escalateAfterHours ?? 24,
    repeatEveryHours: policyDraft.repeatEveryHours ?? policyQuery.data?.repeatEveryHours ?? 24,
    maxEscalationLevel: policyDraft.maxEscalationLevel ?? policyQuery.data?.maxEscalationLevel ?? 3,
  };

  const saveEscalationPolicy = (enabled = escalationPolicy.enabled) => updatePolicy.mutate({ ...escalationPolicy, enabled }, {
    onSuccess: () => {
      setPolicyDraft({});
      toast({ title: enabled ? "Automatic escalation enabled" : "Automatic escalation paused", description: enabled ? "Unacknowledged incidents will escalate after scheduled monitor evaluation." : "Manual escalation remains available." });
    },
    onError: reportError,
  });

  if (channelsQuery.isLoading) {
    return <Card><CardHeader><Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4" />Breach delivery channels</CardTitle>
            <CardDescription className="mt-1">Organization-wide Slack, email, and signed-webhook routing for new warnings, escalations, and recovery events.</CardDescription>
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
          <AlertDescription>Slack URLs, email recipients, generic webhook URLs, and signing secrets are encrypted at rest. Saved secrets are never returned to the browser or written to delivery history.</AlertDescription>
        </Alert>
        <div className="grid gap-4 xl:grid-cols-3">
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

          <ChannelCard
            icon={<Webhook className="h-5 w-5 text-emerald-600" />}
            title="Signed webhook"
            description="HMAC-signed JSON events for your incident tooling."
            configured={Boolean(webhook?.configured)}
            deliveryReady={Boolean(webhook?.deliveryReady)}
            issue={webhook?.issue}
            enabled={Boolean(webhook?.enabled)}
            hint={webhook?.destinationHint}
            canManage={canManage}
            busy={updateChannel.isPending || testChannel.isPending}
            onToggle={(enabled) => toggleChannel("webhook", enabled)}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cost-webhook-url">HTTPS endpoint</Label>
                <Input id="cost-webhook-url" type="url" autoComplete="off" placeholder={webhook?.configured ? "Stored securely — enter only to replace" : "https://events.example.com/infraudit"} value={webhookURL} onChange={(event) => setWebhookURL(event.target.value)} disabled={!canManage} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost-webhook-secret">Signing secret</Label>
                <Input id="cost-webhook-secret" type="password" autoComplete="new-password" placeholder={webhook?.configured ? "Stored securely — enter only to replace" : "At least 32 characters"} value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} disabled={!canManage} />
                <p className="text-xs text-muted-foreground">Verify <code>X-InfraAudit-Signature</code> using HMAC-SHA256 over timestamp + body.</p>
              </div>
            </div>
            {canManage && <div className="flex flex-wrap gap-2"><Button size="sm" onClick={saveWebhook} disabled={updateChannel.isPending}>{updateChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save and enable</Button><Button size="sm" variant="outline" onClick={() => sendTest("webhook")} disabled={testChannel.isPending || (!webhook?.configured && (!webhookURL.trim() || !webhookSecret.trim()))}>Send test</Button></div>}
          </ChannelCard>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3"><div className="rounded-md bg-muted p-2"><Clock3 className="h-5 w-5 text-amber-600" /></div><div><p className="font-semibold">Unacknowledged escalation</p><p className="text-xs text-muted-foreground">Escalate open incidents after the next scheduled cost-monitor evaluation. Acknowledgement pauses the policy; recovery resolves it.</p></div></div>
            <Switch checked={escalationPolicy.enabled} onCheckedChange={(enabled) => saveEscalationPolicy(enabled)} disabled={!canManage || updatePolicy.isPending || policyQuery.isLoading} aria-label="Enable automatic cost incident escalation" />
          </div>
          {policyQuery.isError ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Escalation policy unavailable</AlertTitle><AlertDescription><Button variant="link" className="h-auto p-0" onClick={() => policyQuery.refetch()}>Retry</Button></AlertDescription></Alert> : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="escalate-after">First escalation after</Label><div className="flex items-center gap-2"><Input id="escalate-after" type="number" min={1} max={168} value={escalationPolicy.escalateAfterHours} onChange={(event) => setPolicyDraft((current) => ({ ...current, escalateAfterHours: Number(event.target.value) }))} disabled={!canManage} /><span className="text-sm text-muted-foreground">hours</span></div></div>
              <div className="space-y-2"><Label htmlFor="repeat-escalation">Repeat every</Label><div className="flex items-center gap-2"><Input id="repeat-escalation" type="number" min={1} max={168} value={escalationPolicy.repeatEveryHours} onChange={(event) => setPolicyDraft((current) => ({ ...current, repeatEveryHours: Number(event.target.value) }))} disabled={!canManage} /><span className="text-sm text-muted-foreground">hours</span></div></div>
              <div className="space-y-2"><Label htmlFor="max-escalations">Maximum level</Label><Input id="max-escalations" type="number" min={1} max={10} value={escalationPolicy.maxEscalationLevel} onChange={(event) => setPolicyDraft((current) => ({ ...current, maxEscalationLevel: Number(event.target.value) }))} disabled={!canManage} /></div>
            </div>
          )}
          {canManage && <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Transient network, rate-limit, and 5xx failures are retried three times; every attempt remains visible in incident history.</p><Button size="sm" variant="outline" onClick={() => saveEscalationPolicy()} disabled={updatePolicy.isPending || policyQuery.isLoading}>{updatePolicy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save policy</Button></div>}
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
