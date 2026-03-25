import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Lock, Key, User, Bell, Shield, Cloud, Users, Webhook, Loader2, Copy, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { apiRequest, queryClient, unwrapResponse } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { useLocation } from "wouter";

type ApiKey = { id: number; name: string; keyPrefix: string; rawKey?: string; created: string; lastUsed: string | null };
type TeamMember = { id: number; name: string; email: string; role: string; status: string; createdAt: string };

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Profile — pre-fill from auth user
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email] = useState(user?.email || "");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setJobTitle(user.jobTitle || "");
      setCompany(user.company || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // Account preferences (stored in localStorage)
  const [timezone, setTimezone] = useState(() => localStorage.getItem("ia_timezone") || "UTC");
  const [language, setLanguage] = useState(() => localStorage.getItem("ia_language") || "en");
  const [theme, setThemeState] = useState<"light" | "dark" | "auto">(() =>
    (localStorage.getItem("ia_theme") as "light" | "dark" | "auto") || "auto"
  );

  // Apply theme to document immediately on change
  const setTheme = (newTheme: "light" | "dark" | "auto") => {
    setThemeState(newTheme);
    localStorage.setItem("ia_theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      // Auto: follow system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  };

  // Apply saved theme on mount
  useEffect(() => {
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Security — 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Copied key tracking
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const fileName = `avatars/${session.user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Save to backend
      await apiRequest("PUT", "/api/user/profile", { avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Avatar updated", description: "Your profile picture has been changed." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Cloud — fetch real providers from Go backend
  const { data: cloudProviders, isLoading: isLoadingProviders } = useQuery<any[]>({
    queryKey: ["/api/providers"],
  });

  // Kubernetes clusters from Go backend
  const { data: kubeClusters, isLoading: isLoadingClusters } = useQuery<any>({
    queryKey: ["/api/kubernetes/clusters"],
  });
  const clusters = Array.isArray(kubeClusters) ? kubeClusters : (kubeClusters?.data ?? []);

  // ========== API KEYS — Backend-connected ==========
  const { data: apiKeys = [], isLoading: isLoadingKeys } = useQuery<ApiKey[]>({
    queryKey: ["/api/settings/api-keys"],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/settings/api-keys", { name });
      const json = await res.json();
      return unwrapResponse<ApiKey>(json);
    },
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/api-keys"] });
      toast({
        title: "API Key generated",
        description: newKey.rawKey
          ? "Copy the key now — you won't see it again."
          : "Key created successfully.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to generate key", description: err.message, variant: "destructive" });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/settings/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/api-keys"] });
      toast({ title: "API key revoked" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to revoke key", description: err.message, variant: "destructive" });
    },
  });

  // ========== TEAM — Backend-connected ==========
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/settings/team"],
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await apiRequest("POST", "/api/settings/team", { email, role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/team"] });
      setInviteEmail("");
      toast({ title: "Invitation sent" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to invite", description: err.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      await apiRequest("PUT", `/api/settings/team/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/team"] });
      toast({ title: "Role updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/settings/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/team"] });
      toast({ title: "Team member removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to remove member", description: err.message, variant: "destructive" });
    },
  });

  // ========== ACTIONS ==========

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await apiRequest("PUT", "/api/user/profile", { full_name: fullName, job_title: jobTitle, company });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profile saved", description: "Your changes have been applied." });
    } catch (err: any) {
      toast({ title: "Failed to save profile", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password changed", description: "Your password has been updated." });
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
    } catch (err: any) {
      toast({ title: "Failed to change password", description: err.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const saveAccountPreferences = () => {
    localStorage.setItem("ia_timezone", timezone);
    localStorage.setItem("ia_language", language);
    localStorage.setItem("ia_theme", theme);
    toast({ title: "Account settings saved", description: "Your changes have been applied." });
  };

  const handleDisconnectProvider = async (providerName: string) => {
    try {
      await api.providers.disconnect(providerName.toLowerCase());
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      toast({ title: "Provider disconnected", description: `${providerName} has been disconnected.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to disconnect provider.", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, keyId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Configure and customize your InfraAudit experience" />

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />Alerts</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-2" />Webhooks</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="cloud"><Cloud className="h-4 w-4 mr-2" />Cloud</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-2" />Team</TabsTrigger>
        </TabsList>

        {/* ==================== Profile Settings ==================== */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your identity and organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "User"}`} />
                    <AvatarFallback>{(fullName || user?.username || "US").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                  {isUploadingAvatar && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email Address</Label><Input value={email} disabled /></div>
                  <div className="space-y-2"><Label>Job Title</Label><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. DevOps Engineer" /></div>
                  <div className="space-y-2"><Label>Company / Organization</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" /></div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={isSavingProfile}>
                  {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Account Settings ==================== */}
        <TabsContent value="account" className="space-y-6">
          <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Preferences for locale, time and theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue placeholder="Timezone" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <RadioGroup value={theme} onValueChange={(v) => setTheme(v as any)} className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><RadioGroupItem value="light" id="t-light" /><Label htmlFor="t-light">Light</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="dark" id="t-dark" /><Label htmlFor="t-dark">Dark</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="auto" id="t-auto" /><Label htmlFor="t-auto">Auto</Label></div>
                  </RadioGroup>
                </div>
              </div>

              {/* Change Password — wired to Supabase auth */}
              <div className="border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-muted-foreground">Set a strong and unique password for your account</div>
                  </div>
                  {!showPasswordFields && (
                    <Button variant="outline" onClick={() => setShowPasswordFields(true)}>
                      <Lock className="mr-2 h-4 w-4" /> Change Password
                    </Button>
                  )}
                </div>
                {showPasswordFields && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setShowPasswordFields(false); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
                      <Button onClick={changePassword} disabled={isChangingPassword}>
                        {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end"><Button onClick={saveAccountPreferences}>Save Changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Notification Settings ==================== */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationPreferences />
        </TabsContent>

        {/* ==================== Webhooks Settings ==================== */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Configure webhook endpoints to receive event payloads.</CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Security Settings ==================== */}
        <TabsContent value="security" className="space-y-6">
          <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Protect your account and API usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border rounded-xl p-4">
                <div><div className="font-medium">Two-Factor Authentication</div><div className="text-sm text-muted-foreground">Add an extra layer of security</div></div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  <Switch checked={twoFAEnabled} onCheckedChange={setTwoFAEnabled} disabled />
                </div>
              </div>

              {/* API Keys — Backend-connected */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">API Key Management</div>
                  <Button onClick={() => createKeyMutation.mutate("API Key")} disabled={createKeyMutation.isPending}>
                    {createKeyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                    Generate
                  </Button>
                </div>
                <div className="border rounded-xl divide-y">
                  {isLoadingKeys ? (
                    <div className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading keys...</div>
                  ) : apiKeys.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No API keys generated yet.</div>
                  ) : (
                    apiKeys.map(k => (
                      <div key={k.id} className="grid grid-cols-4 p-4 items-center">
                        <div className="flex items-center gap-2">
                          <span>{k.name}</span>
                          {k.rawKey && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(k.rawKey!, k.id)}>
                              {copiedKeyId === k.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">{k.rawKey || k.keyPrefix}</div>
                        <div className="text-sm text-muted-foreground">Created {k.created}</div>
                        <div className="text-right">
                          <Button variant="outline" size="sm" onClick={() => revokeKeyMutation.mutate(k.id)} disabled={revokeKeyMutation.isPending}>
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Cloud & Integrations ==================== */}
        <TabsContent value="cloud" className="space-y-6">
          <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
            <CardHeader><CardTitle>Cloud & Integrations</CardTitle><CardDescription>Connect providers and developer tools</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="font-medium">Connected Cloud Accounts</div>
                <div className="border rounded-xl divide-y">
                  {isLoadingProviders ? (
                    <div className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading providers...</div>
                  ) : cloudProviders && cloudProviders.length > 0 ? (
                    cloudProviders.map((p: any) => (
                      <div key={p.id || p.provider} className="grid grid-cols-4 p-4 items-center">
                        <div className="font-medium">{(p.provider || p.name || "Unknown").toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{p.name || p.provider}</div>
                        <div>
                          <Badge variant={p.status === "connected" ? "secondary" : "destructive"} className="capitalize">
                            {p.status}
                          </Badge>
                        </div>
                        <div className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleDisconnectProvider(p.provider)}>Disconnect</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No cloud providers connected. <a href="/cloud-providers" className="text-primary underline">Connect one now</a>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="font-medium">Kubernetes Clusters</div>
                <div className="border rounded-xl divide-y">
                  {isLoadingClusters ? (
                    <div className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading clusters...</div>
                  ) : clusters.length > 0 ? (
                    clusters.map((c: any) => (
                      <div key={c.id} className="grid grid-cols-3 p-4 items-center">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">{c.provider} · {c.region}</div>
                        <div className="text-right">
                          <Button variant="outline" size="sm" onClick={() => navigate("/kubernetes")}>Manage</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No Kubernetes clusters registered. <a href="/kubernetes" className="text-primary underline">Add one now</a>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border rounded-xl p-4">
                  <div><div className="font-medium">GitHub Integration</div><div className="text-sm text-muted-foreground">Link repos for IaC scanning and PR checks</div></div>
                  <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "GitHub integration will be available in a future update." })}>Connect</Button>
                </div>
                <div className="flex items-center justify-between border rounded-xl p-4">
                  <div><div className="font-medium">GitLab Integration</div><div className="text-sm text-muted-foreground">Enable merge request checks</div></div>
                  <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "GitLab integration will be available in a future update." })}>Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Team & Access ==================== */}
        <TabsContent value="team" className="space-y-6">
          <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
            <CardHeader><CardTitle>Team & Access</CardTitle><CardDescription>Manage members and permissions</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Current Role</Label><Input value={user?.role || "Admin"} disabled /></div>
                <div className="space-y-2 md:col-span-2"><Label>Invite Team Member</Label>
                  <div className="flex gap-2">
                    <Input placeholder="user@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => { if (inviteEmail) inviteMutation.mutate({ email: inviteEmail, role: inviteRole }); }}
                      disabled={inviteMutation.isPending || !inviteEmail}
                    >
                      {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Invite
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border rounded-xl divide-y">
                <div className="grid grid-cols-4 font-medium p-4"><div>Name</div><div>Email</div><div>Role</div><div className="text-right">Actions</div></div>
                {isLoadingTeam ? (
                  <div className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading team...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No team members yet. Invite someone above.</div>
                ) : (
                  teamMembers.map(m => (
                    <div key={m.id} className="grid grid-cols-4 p-4 items-center">
                      <div className="flex items-center gap-2">
                        {m.name}
                        {m.status === "invited" && <Badge variant="outline" className="text-xs">Invited</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">{m.email}</div>
                      <div>
                        <Select value={m.role} onValueChange={(v) => updateRoleMutation.mutate({ id: m.id, role: v })}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMemberMutation.mutate(m.id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
