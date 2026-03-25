import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotificationPreferences, useUpdatePreference, useSendTestNotification } from "@/hooks/use-notifications";
import { Mail, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NotificationPreferences() {
    const { toast } = useToast();
    const { data: preferences, isLoading } = useNotificationPreferences();
    const { mutate: updatePreference, isPending: isUpdating } = useUpdatePreference();
    const { mutate: testNotification, isPending: isTesting } = useSendTestNotification();

    // Local state for input fields
    const [emailRecipients, setEmailRecipients] = useState('');
    const [slackWebhookUrl, setSlackWebhookUrl] = useState('');

    // Helper to get pref for a channel — backend returns {isEnabled, config, channel}
    const getPref = (channel: string): { isEnabled: boolean; config: any } => {
        if (Array.isArray(preferences)) {
            const found = preferences.find((p: any) => p.channel === channel);
            if (found) return { isEnabled: found.isEnabled ?? found.enabled ?? false, config: found.config || {} };
        }
        return { isEnabled: false, config: {} };
    };

    const handleToggle = (channel: string, enabled: boolean) => {
        const currentConfig = getPref(channel).config || {};
        updatePreference({
            channel,
            settings: { enabled, ...currentConfig }
        }, {
            onSuccess: () => toast({ title: "Updated", description: `${channel} notifications ${enabled ? 'enabled' : 'disabled'}.` }),
            onError: () => toast({ title: "Failed", description: "Could not update preference.", variant: "destructive" })
        });
    };

    const handleTest = (channel: string) => {
        testNotification({ channel, message: `This is a test ${channel} notification from InfraAudit.` }, {
            onSuccess: () => toast({ title: "Test Sent", description: `Test notification queued for ${channel}.` }),
            onError: (err: any) => toast({ title: "Failed", description: err?.message || "Could not send test notification.", variant: "destructive" })
        });
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading preferences...
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        <CardTitle>Email Notifications</CardTitle>
                    </div>
                    <CardDescription>Receive alerts and reports via email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-toggle">Enable Email Alerts</Label>
                        <Switch
                            id="email-toggle"
                            checked={getPref('email').isEnabled}
                            onCheckedChange={(c) => handleToggle('email', c)}
                            disabled={isUpdating}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Recipients (comma separated)</Label>
                        <Input
                            placeholder="admin@example.com, devops@example.com"
                            value={emailRecipients}
                            onChange={(e) => setEmailRecipients(e.target.value)}
                        />
                        <Button
                            size="sm"
                            onClick={() => handleTest('email')}
                            disabled={isTesting}
                        >
                            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Test Email
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <CardTitle>Slack Notifications</CardTitle>
                    </div>
                    <CardDescription>Get notified in your Slack channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="slack-toggle">Enable Slack Alerts</Label>
                        <Switch
                            id="slack-toggle"
                            checked={getPref('slack').isEnabled}
                            onCheckedChange={(c) => handleToggle('slack', c)}
                            disabled={isUpdating}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input
                            type="password"
                            placeholder="https://hooks.slack.com/services/..."
                            value={slackWebhookUrl}
                            onChange={(e) => setSlackWebhookUrl(e.target.value)}
                        />
                        <Button
                            size="sm"
                            onClick={() => handleTest('slack')}
                            disabled={isTesting}
                        >
                            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Test Message
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
