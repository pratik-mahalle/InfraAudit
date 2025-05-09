import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  DollarSign,
  Server,
  Cloud,
  Save,
  CirclePlus,
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  
  // General settings state
  const [userName, setUserName] = useState("John Smith");
  const [userEmail, setUserEmail] = useState("john.smith@company.com");
  const [userRole, setUserRole] = useState("DevOps Engineer");
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [costAlerts, setCostAlerts] = useState(true);
  const [resourceAlerts, setResourceAlerts] = useState(false);
  
  // Cloud accounts state
  const [awsAccount, setAwsAccount] = useState("123456789012");
  const [gcpAccount, setGcpAccount] = useState("my-project-id");
  const [azureAccount, setAzureAccount] = useState("subscription-id");
  
  // Threshold settings state
  const [costThreshold, setCostThreshold] = useState("20");
  const [cpuThreshold, setCpuThreshold] = useState("80");
  const [memoryThreshold, setMemoryThreshold] = useState("80");
  const [storageThreshold, setStorageThreshold] = useState("90");

  const handleSaveGeneral = () => {
    toast({
      title: "Profile settings saved",
      description: "Your profile information has been updated.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handleSaveCloudAccounts = () => {
    toast({
      title: "Cloud accounts saved",
      description: "Your cloud account settings have been updated.",
    });
  };

  const handleSaveThresholds = () => {
    toast({
      title: "Alert thresholds saved",
      description: "Your alert threshold settings have been updated.",
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Configure and customize your CloudGuard experience"
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto rounded-lg">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="cloud-accounts" className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <span>Cloud Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center space-x-2">
            <SettingsIcon className="h-4 w-4" />
            <span>Alert Thresholds</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={userEmail} 
                    onChange={(e) => setUserEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Job Title</Label>
                  <Input 
                    id="role" 
                    value={userRole} 
                    onChange={(e) => setUserRole(e.target.value)} 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select 
                    id="timezone" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST" selected>Eastern Time (EST/EDT)</option>
                    <option value="CST">Central Time (CST/CDT)</option>
                    <option value="MST">Mountain Time (MST/MDT)</option>
                    <option value="PST">Pacific Time (PST/PDT)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable dark mode for the interface
                    </p>
                  </div>
                  <Switch id="dark-mode" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">Cancel</Button>
              <Button onClick={handleSaveGeneral} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="slack-notifications">Slack Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive alerts in Slack
                    </p>
                  </div>
                  <Switch 
                    id="slack-notifications"
                    checked={slackNotifications}
                    onCheckedChange={setSlackNotifications}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Types</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Alerts
                    </Label>
                    <p className="text-sm text-gray-500">
                      Security configuration drifts and threats
                    </p>
                  </div>
                  <Switch 
                    id="security-alerts"
                    checked={securityAlerts}
                    onCheckedChange={setSecurityAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cost-alerts" className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Cost Alerts
                    </Label>
                    <p className="text-sm text-gray-500">
                      Cost anomalies and budget thresholds
                    </p>
                  </div>
                  <Switch 
                    id="cost-alerts"
                    checked={costAlerts}
                    onCheckedChange={setCostAlerts}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="resource-alerts" className="flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Resource Alerts
                    </Label>
                    <p className="text-sm text-gray-500">
                      Resource utilization and availability
                    </p>
                  </div>
                  <Switch 
                    id="resource-alerts"
                    checked={resourceAlerts}
                    onCheckedChange={setResourceAlerts}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">Cancel</Button>
              <Button onClick={handleSaveNotifications} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Cloud Accounts Tab */}
        <TabsContent value="cloud-accounts">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Accounts</CardTitle>
              <CardDescription>
                Connect and manage your cloud provider accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#FF9900] p-2 rounded">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.75 11.25H15a.75.75 0 0 1-.75-.75V7.5A1.5 1.5 0 0 0 12.75 6h-1.5A1.5 1.5 0 0 0 9.75 7.5v3A.75.75 0 0 1 9 11.25H5.25a1.5 1.5 0 0 0-1.5 1.5v1.5a1.5 1.5 0 0 0 1.5 1.5H9a.75.75 0 0 1 .75.75v3a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5v-3a.75.75 0 0 1 .75-.75h3.75a1.5 1.5 0 0 0 1.5-1.5v-1.5a1.5 1.5 0 0 0-1.5-1.5Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">AWS Account</h3>
                      <p className="text-sm text-gray-500">Account ID: {awsAccount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="success">Connected</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#4285F4] p-2 rounded">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 11v2h2v2h-2v2h-2v-2H8v-2h2v-2h2Zm-2.15-1.35L12 7.5l2.15 2.15 3.3-3.3L12 1.5 6.55 6.35l3.3 3.3ZM12 16.5l-2.15-2.15-3.3 3.3L12 22.5l5.45-4.85-3.3-3.3L12 16.5Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Google Cloud Platform</h3>
                      <p className="text-sm text-gray-500">Project ID: {gcpAccount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="success">Connected</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#0078D4] p-2 rounded">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 16.2h12V21H6zm8.4-4.8v6h6v-6zm-8.4 0v6h6v-6zM12 3l-5.4 9.6h10.8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Microsoft Azure</h3>
                      <p className="text-sm text-gray-500">Subscription ID: {azureAccount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="success">Connected</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 flex items-center justify-center gap-2">
                  <CirclePlus className="h-4 w-4" />
                  Add New Cloud Account
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">Cancel</Button>
              <Button onClick={handleSaveCloudAccounts} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Alert Thresholds Tab */}
        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>
                Configure thresholds for when alerts should be triggered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cost Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost-threshold">Cost Increase Threshold (%)</Label>
                    <div className="flex items-center">
                      <Input 
                        id="cost-threshold" 
                        type="number" 
                        value={costThreshold}
                        onChange={(e) => setCostThreshold(e.target.value)}
                        className="w-full"
                      />
                      <span className="ml-2">%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Alert when costs increase by this percentage compared to the previous period
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Resource Utilization Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpu-threshold">CPU Utilization Threshold (%)</Label>
                    <div className="flex items-center">
                      <Input 
                        id="cpu-threshold" 
                        type="number" 
                        value={cpuThreshold}
                        onChange={(e) => setCpuThreshold(e.target.value)}
                        className="w-full"
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="memory-threshold">Memory Utilization Threshold (%)</Label>
                    <div className="flex items-center">
                      <Input 
                        id="memory-threshold" 
                        type="number" 
                        value={memoryThreshold}
                        onChange={(e) => setMemoryThreshold(e.target.value)}
                        className="w-full"
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storage-threshold">Storage Utilization Threshold (%)</Label>
                    <div className="flex items-center">
                      <Input 
                        id="storage-threshold" 
                        type="number" 
                        value={storageThreshold}
                        onChange={(e) => setStorageThreshold(e.target.value)}
                        className="w-full"
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Alert Settings</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatically Remediate</Label>
                    <p className="text-sm text-gray-500">
                      Automatically fix common security issues
                    </p>
                  </div>
                  <Switch id="auto-remediate" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">Cancel</Button>
              <Button onClick={handleSaveThresholds} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
