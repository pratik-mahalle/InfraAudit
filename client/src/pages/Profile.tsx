import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Key, Lock, LogOut, Shield, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type ApiKey = { id: number; name: string; created: string; lastUsed: string };
type Session = { id: number; device: string; ip: string; lastActive: string };
type CloudAccount = { id: number; provider: "AWS" | "GCP" | "Azure"; account: string; status: "connected" | "error" };
type Cluster = { id: number; name: string; provider: string; region: string };
type TeamUser = { id: number; name: string; email: string; role: "Admin" | "Editor" | "Viewer" };

export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  // Profile Settings
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email] = useState("user@example.com");
  const [jobTitle, setJobTitle] = useState("Cloud Administrator");
  const [company, setCompany] = useState("InfraAudit");
  const [avatar, setAvatar] = useState<File | null>(null);

  // Account Settings
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackConnected, setSlackConnected] = useState(false);
  const [costThreshold, setCostThreshold] = useState(20);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  // Security Settings
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: 1, name: "InfrAudit CLI", created: "2025-01-15", lastUsed: "2025-09-01" },
    { id: 2, name: "Terraform Integration", created: "2025-02-02", lastUsed: "2025-09-23" },
  ]);
  const [sessions, setSessions] = useState<Session[]>([
    { id: 1, device: "Chrome · macOS", ip: "73.182.10.5", lastActive: "2 hours ago" },
    { id: 2, device: "Safari · iOS", ip: "10.0.1.3", lastActive: "Yesterday" },
  ]);

  // Cloud & Integrations
  const [cloudAccounts, setCloudAccounts] = useState<CloudAccount[]>([
    { id: 1, provider: "AWS", account: "1234-5678-9012", status: "connected" },
    { id: 2, provider: "GCP", account: "proj-infraudit", status: "connected" },
  ]);
  const [clusters] = useState<Cluster[]>([
    { id: 1, name: "prod-cluster", provider: "EKS", region: "us-east-1" },
    { id: 2, name: "staging-k8s", provider: "GKE", region: "us-central1" },
  ]);
  const [vcsConnected, setVcsConnected] = useState<{ github: boolean; gitlab: boolean }>({ github: false, gitlab: false });

  // Team & Access
  const [currentRole] = useState<"Admin" | "Editor" | "Viewer">("Admin");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Editor" | "Viewer">("Viewer");
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([
    { id: 1, name: user.fullName || user.username, email: email, role: "Admin" },
    { id: 2, name: "Alex Rivera", email: "alex@infraudit.dev", role: "Editor" },
    { id: 3, name: "Priya Singh", email: "priya@infraudit.dev", role: "Viewer" },
  ]);

  const save = (section: string) => toast({ title: `${section} saved`, description: "Your changes have been applied." });

  const handleGenerateKey = () => {
    const newKey: ApiKey = { id: Date.now(), name: "New API Key", created: new Date().toISOString().slice(0, 10), lastUsed: "—" };
    setApiKeys(prev => [newKey, ...prev]);
    toast({ title: "API Key generated", description: "Copy it now. You won't see it again." });
  };
  const handleRevokeKey = (id: number) => setApiKeys(prev => prev.filter(k => k.id !== id));
  const handleLogoutSession = (id: number) => setSessions(prev => prev.filter(s => s.id !== id));
  const handleDisconnectCloud = (id: number) => setCloudAccounts(prev => prev.filter(a => a.id !== id));

  return (
    <DashboardLayout>
      <div className="px-4 md:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="cloud">Cloud</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
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
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                      <AvatarFallback>{(user.fullName || user.username).slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" value={email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company / Organization</Label>
                      <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save("Profile settings")}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
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
                      <div className="flex items-center gap-2"><RadioGroupItem value="light" id="theme-light" /><Label htmlFor="theme-light">Light</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="dark" id="theme-dark" /><Label htmlFor="theme-dark">Dark</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="auto" id="theme-auto" /><Label htmlFor="theme-auto">Auto</Label></div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="flex items-center justify-between border rounded-xl p-4">
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-muted-foreground">Set a strong and unique password for your account</div>
                  </div>
                  <Button variant="outline"><Lock className="mr-2 h-4 w-4" /> Change Password</Button>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save("Account settings")}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Control alerts and communication channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive product and alert emails</div>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div>
                      <div className="font-medium">Slack / Teams Integration</div>
                      <div className="text-sm text-muted-foreground">Send alerts to your chat channels</div>
                    </div>
                    <Button variant={slackConnected ? "outline" : "default"} onClick={() => setSlackConnected(!slackConnected)}>
                      {slackConnected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div>
                      <div className="font-medium">Cost Alert Threshold</div>
                      <div className="text-sm text-muted-foreground">Notify when monthly cost exceeds this value</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-24" value={costThreshold} onChange={(e) => setCostThreshold(Number(e.target.value))} />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div>
                      <div className="font-medium">Critical Security Alerts</div>
                      <div className="text-sm text-muted-foreground">Always on for administrators</div>
                    </div>
                    <Switch checked={criticalAlerts} onCheckedChange={setCriticalAlerts} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save("Notification settings")}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Protect your account and API usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border rounded-xl p-4">
                  <div>
                    <div className="font-medium">Two‑Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                  </div>
                  <Switch checked={twoFAEnabled} onCheckedChange={setTwoFAEnabled} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">API Key Management</div>
                    <Button onClick={handleGenerateKey}><Key className="mr-2 h-4 w-4" /> Generate</Button>
                  </div>
                  <div className="border rounded-xl divide-y">
                    {apiKeys.map(k => (
                      <div key={k.id} className="grid grid-cols-4 p-4 items-center">
                        <div>{k.name}</div>
                        <div className="text-sm text-muted-foreground">Created {k.created}</div>
                        <div className="text-sm text-muted-foreground">Last used {k.lastUsed}</div>
                        <div className="text-right"><Button variant="outline" size="sm" onClick={() => handleRevokeKey(k.id)}>Revoke</Button></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-medium">Active Sessions</div>
                  <div className="border rounded-xl divide-y">
                    {sessions.map(s => (
                      <div key={s.id} className="grid grid-cols-4 p-4 items-center">
                        <div>{s.device}</div>
                        <div className="text-sm text-muted-foreground">{s.ip}</div>
                        <div className="text-sm text-muted-foreground">{s.lastActive}</div>
                        <div className="text-right"><Button variant="outline" size="sm" onClick={() => handleLogoutSession(s.id)}>Logout</Button></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save("Security settings")}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cloud & Integrations */}
          <TabsContent value="cloud" className="space-y-6">
            <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Cloud & Integrations</CardTitle>
                <CardDescription>Connect providers and developer tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="font-medium">Connected Cloud Accounts</div>
                  <div className="border rounded-xl divide-y">
                    {cloudAccounts.map(a => (
                      <div key={a.id} className="grid grid-cols-4 p-4 items-center">
                        <div className="font-medium">{a.provider}</div>
                        <div className="text-sm text-muted-foreground">{a.account}</div>
                        <div>
                          <Badge variant={a.status === 'connected' ? 'secondary' : 'destructive'} className="capitalize">{a.status}</Badge>
                        </div>
                        <div className="text-right space-x-2">
                          <Button variant="outline" size="sm">Manage</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDisconnectCloud(a.id)}>Disconnect</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="font-medium">Kubernetes Clusters</div>
                  <div className="border rounded-xl divide-y">
                    {clusters.map(c => (
                      <div key={c.id} className="grid grid-cols-3 p-4 items-center">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">{c.provider} · {c.region}</div>
                        <div className="text-right"><Button variant="outline" size="sm">Manage</Button></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div>
                      <div className="font-medium">GitHub Integration</div>
                      <div className="text-sm text-muted-foreground">Link repos for IaC scanning and PR checks</div>
                    </div>
                    <Button variant={vcsConnected.github ? 'outline' : 'default'} onClick={() => setVcsConnected(s => ({ ...s, github: !s.github }))}>{vcsConnected.github ? 'Disconnect' : 'Connect'}</Button>
                  </div>
                  <div className="flex items-center justify-between border rounded-xl p-4">
                    <div>
                      <div className="font-medium">GitLab Integration</div>
                      <div className="text-sm text-muted-foreground">Enable merge request checks</div>
                    </div>
                    <Button variant={vcsConnected.gitlab ? 'outline' : 'default'} onClick={() => setVcsConnected(s => ({ ...s, gitlab: !s.gitlab }))}>{vcsConnected.gitlab ? 'Disconnect' : 'Connect'}</Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save("Cloud & integrations")}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team & Access */}
          <TabsContent value="team" className="space-y-6">
            <Card className="rounded-2xl shadow bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Team & Access</CardTitle>
                <CardDescription>Manage members and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Current Role</Label>
                    <Input value={currentRole} disabled />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Invite Team Member</Label>
                    <div className="flex gap-2">
                      <Input placeholder="user@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Editor">Editor</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => { if (inviteEmail) { setTeamUsers(prev => [...prev, { id: Date.now(), name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole }]); setInviteEmail(""); toast({ title: "Invitation sent" }); } }}>Invite</Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl divide-y">
                  <div className="grid grid-cols-4 font-medium p-4">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div className="text-right">Actions</div>
                  </div>
                  {teamUsers.map(u => (
                    <div key={u.id} className="grid grid-cols-4 p-4 items-center">
                      <div>{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                      <div>
                        <Select value={u.role} onValueChange={(v) => setTeamUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: v as any } : x))}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-right space-x-2">
                        <Button variant="outline" size="sm">Manage</Button>
                        <Button variant="outline" size="sm" onClick={() => setTeamUsers(prev => prev.filter(x => x.id !== u.id))}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => save("Team & access")}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}