import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotificationPreferences, useUpdatePreference, useSendTestNotification } from "@/hooks/use-notifications";
import { Mail, MessageSquare, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NotificationPreferences() {
    const { toast } = useToast();
    const { data: preferences, isLoading } = useNotificationPreferences();
    const { mutate: updatePreference } = useUpdatePreference();
    const { mutate: testNotification } = useSendTestNotification();

    // Helper to get pref for a channel
    const getPref = (channel: string): any => {
        // Assuming backend returns an array or object. Let's handle array.
        if (Array.isArray(preferences)) {
            return preferences.find((p: any) => p.channel === channel) || { enabled: false, settings: {} };
        }
        // Handle object if it comes that way
        return (preferences as any)?.[channel] || { enabled: false, settings: {} };
    };

    const handleToggle = (channel: string, enabled: boolean) => {
        updatePreference({
            channel,
            settings: { ...getPref(channel).settings, enabled }
        }, {
            onSuccess: () => toast({ title: "Updated", description: `${channel} notifications ${enabled ? 'enabled' : 'disabled'}.` })
        });
    };

    const handleTest = (channel: string) => {
        testNotification({ channel, message: "This is a test notification from InfraAudit." }, {
            onSuccess: () => toast({ title: "Test Sent", description: `Test notification sent to ${channel}.` }),
            onError: () => toast({ title: "Failed", description: "Could not send test notification.", variant: "destructive" })
        });
    };

    if (isLoading) return <div>Loading preferences...</div>;

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
                            checked={getPref('email').enabled}
                            onCheckedChange={(c) => handleToggle('email', c)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Recipients (comma separated)</Label>
                        <Input
                            placeholder="admin@example.com, devops@example.com"
                            defaultValue={getPref('email').settings?.recipients || ''}
                        />
                        <Button size="sm" onClick={() => handleTest('email')}>Send Test Email</Button>
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
                            checked={getPref('slack').enabled}
                            onCheckedChange={(c) => handleToggle('slack', c)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input
                            type="password"
                            placeholder="https://hooks.slack.com/services/..."
                            defaultValue={getPref('slack').settings?.webhookUrl || ''}
                        />
                        <Button size="sm" onClick={() => handleTest('slack')}>Send Test Message</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
