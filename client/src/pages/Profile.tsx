import { useState } from "react";
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
import { Bell, Key, Lock, LogOut, Mail, Shield, User } from "lucide-react";

export default function Profile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user preferences that would come from the backend
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    slackNotifications: true,
    dailyReports: true,
    weeklyReports: true,
    criticalAlerts: true,
    securityAlerts: true,
    costAlerts: true,
  });

  // Mock API keys that would come from the backend
  const [apiKeys] = useState([
    { id: 1, name: "CloudGuard CLI", created: "2023-06-15", lastUsed: "2023-12-01" },
    { id: 2, name: "Terraform Integration", created: "2023-08-22", lastUsed: "2023-12-10" },
  ]);

  // Mock access tokens that would come from the backend
  const [accessTokens] = useState([
    { id: 1, name: "AWS Integration", expires: "2024-01-15" },
    { id: 2, name: "GCP Integration", expires: "2024-02-20" },
    { id: 3, name: "Azure Integration", expires: "2024-03-10" },
  ]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile via an API call
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile changes have been saved.",
    });
  };

  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast({
      title: "Preference Updated",
      description: `${key} has been ${preferences[key] ? "disabled" : "enabled"}.`,
    });
  };

  const createNewAPIKey = () => {
    // In a real app, this would create a new API key via an API call
    toast({
      title: "New API Key",
      description: "A new API key has been generated and copied to your clipboard.",
    });
  };

  const revokeAPIKey = (id: number) => {
    // In a real app, this would revoke the API key via an API call
    toast({
      title: "API Key Revoked",
      description: "The API key has been revoked and can no longer be used.",
    });
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Manage your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center space-y-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        value={user.username} 
                        readOnly={!isEditing} 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={'user@example.com'} 
                        readOnly={!isEditing} 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={user.fullName || 'Cloud Administrator'} 
                        readOnly={!isEditing} 
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input 
                        id="role" 
                        value={user.role || 'Cloud Administrator'} 
                        readOnly 
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>
                  View your account status and subscription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Account Type
                    </div>
                    <div className="font-medium">
                      Enterprise Plan
                      <Badge className="ml-2" variant="secondary">Active</Badge>
                    </div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Next Billing Date
                    </div>
                    <div className="font-medium">January 15, 2024</div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Resources Monitored
                    </div>
                    <div className="font-medium">128 / Unlimited</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure when and how you want to receive alerts and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Notification Channels</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>Email Notifications</div>
                        </div>
                        <Button 
                          variant={preferences.emailNotifications ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('emailNotifications')}
                        >
                          {preferences.emailNotifications ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div className="flex items-center gap-2">
                          <svg 
                            className="h-5 w-5 text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                          >
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                          </svg>
                          <div>Slack Notifications</div>
                        </div>
                        <Button 
                          variant={preferences.slackNotifications ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('slackNotifications')}
                        >
                          {preferences.slackNotifications ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Report Frequency</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div>Daily Summary</div>
                        <Button 
                          variant={preferences.dailyReports ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('dailyReports')}
                        >
                          {preferences.dailyReports ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div>Weekly Digest</div>
                        <Button 
                          variant={preferences.weeklyReports ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('weeklyReports')}
                        >
                          {preferences.weeklyReports ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Alert Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div>Critical Alerts</div>
                        <Button 
                          variant={preferences.criticalAlerts ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('criticalAlerts')}
                        >
                          {preferences.criticalAlerts ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div>Security Alerts</div>
                        <Button 
                          variant={preferences.securityAlerts ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('securityAlerts')}
                        >
                          {preferences.securityAlerts ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between border rounded-md p-4">
                        <div>Cost Alerts</div>
                        <Button 
                          variant={preferences.costAlerts ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTogglePreference('costAlerts')}
                        >
                          {preferences.costAlerts ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for programmatic access to CloudGuard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={createNewAPIKey}>
                      <Key className="mr-2 h-4 w-4" />
                      Generate New API Key
                    </Button>
                  </div>
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No API keys found. Generate your first key to get started.
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <div className="grid grid-cols-4 font-medium p-4 border-b">
                        <div>Name</div>
                        <div>Created</div>
                        <div>Last Used</div>
                        <div className="text-right">Actions</div>
                      </div>
                      <div className="divide-y">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="grid grid-cols-4 p-4 items-center">
                            <div>{key.name}</div>
                            <div className="text-sm text-muted-foreground">{key.created}</div>
                            <div className="text-sm text-muted-foreground">{key.lastUsed}</div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => revokeAPIKey(key.id)}
                              >
                                Revoke
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Tokens</CardTitle>
                <CardDescription>
                  Manage tokens for accessing cloud provider services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 font-medium p-4 border-b">
                    <div>Integration</div>
                    <div>Expires</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {accessTokens.map((token) => (
                      <div key={token.id} className="grid grid-cols-3 p-4 items-center">
                        <div>{token.name}</div>
                        <div className="text-sm text-muted-foreground">{token.expires}</div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">Refresh</Button>
                          <Button variant="outline" size="sm">Revoke</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to ensure account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input id="currentPassword" type="password" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input id="newPassword" type="password" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type="password" />
                    </div>
                  </div>
                  <Button>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}