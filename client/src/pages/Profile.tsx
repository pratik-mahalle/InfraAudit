import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Settings, Shield, Cloud, Bell, Key, ChevronRight } from "lucide-react";

export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  // Fetch provider count for the summary
  const { data: providers } = useQuery<any[]>({ queryKey: ["/api/providers"] });
  const connectedProviders = providers?.filter((p: any) => p.status === "connected")?.length ?? 0;

  const initials = (user.fullName || user.username || "US").slice(0, 2).toUpperCase();
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—";

  return (
    <DashboardLayout>
      <div className="px-4 md:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="rounded-2xl shadow bg-white dark:bg-gray-900 mb-6">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                  <Badge variant="secondary" className="capitalize">{user.role || "admin"}</Badge>
                  {user.planType && <Badge variant="outline">{user.planType} Plan</Badge>}
                  <Badge variant="outline">Member since {memberSince}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Edit Settings
                </Button>
                <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/settings")}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Cloud className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-semibold">{connectedProviders}</div>
                <div className="text-sm text-muted-foreground">Cloud Providers</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/settings")}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-semibold">{user.subscriptionStatus === "active" ? "Active" : "—"}</div>
                <div className="text-sm text-muted-foreground">Subscription</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/settings")}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-lg bg-violet-500/10">
                <Bell className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-semibold">Configured</div>
                <div className="text-sm text-muted-foreground">Notifications</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: Settings, label: "Account Settings", desc: "Profile, theme, preferences", tab: "profile" },
              { icon: Shield, label: "Security & API Keys", desc: "2FA, sessions, API keys", tab: "security" },
              { icon: Cloud, label: "Cloud Integrations", desc: "AWS, GCP, Azure connections", tab: "cloud" },
              { icon: Bell, label: "Alert Preferences", desc: "Notification channels and thresholds", tab: "notifications" },
              { icon: Key, label: "Webhooks", desc: "Event payload endpoints", tab: "webhooks" },
            ].map((item) => (
              <div
                key={item.tab}
                className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => navigate("/settings")}
              >
                <div className="flex items-center gap-4">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
