import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { 
  Cloud, 
  Shield, 
  DollarSign, 
  Bell, 
  LineChart, 
  Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Documentation = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">InfraAudit Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive guide to monitoring and optimizing your cloud infrastructure
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="connection">Cloud Connection</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="costs">Cost Optimization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>InfraAudit Platform Overview</CardTitle>
                <CardDescription>
                  Welcome to the InfraAudit platform documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground dark:text-foreground">
                  InfraAudit is a comprehensive cloud infrastructure monitoring and optimization platform designed to help
                  DevOps teams, cloud engineers, and IT managers gain complete visibility and control over their multi-cloud
                  environments. Our platform provides real-time monitoring, security configuration drift detection, cost
                  optimization recommendations, and predictive analytics.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3 mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Security Monitoring</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Detect security configuration drifts and vulnerability exposures in real-time
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3 mb-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Cost Optimization</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Identify cost-saving opportunities with AI-powered recommendations
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3 mb-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Multi-Cloud Support</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seamlessly monitor AWS, GCP, and Azure resources from a single dashboard
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3 mb-2">
                      <LineChart className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Predictive Analytics</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Forecast future resource needs and costs with ML-powered predictions
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3 mb-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Intelligent Alerting</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive contextual alerts and notifications through multiple channels
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center space-x-3 mb-2">
                      <Workflow className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Automation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automate remediation actions and policy enforcement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>
                  Explore InfraAudit's comprehensive feature set
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground dark:text-foreground">
                  InfraAudit offers a wide range of features designed to provide complete visibility and control over your cloud infrastructure.
                  Below are some of the key features available on our platform.
                </p>
                
                <h3 className="text-lg font-medium">Dashboard & Visualization</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground dark:text-foreground">
                  <li>Customizable dashboard with real-time metrics and KPIs</li>
                  <li>Interactive charts and graphs for easy data visualization</li>
                  <li>Resource utilization and performance trends</li>
                  <li>Cost analytics with detailed breakdown by service, region, and account</li>
                </ul>
                
                <h3 className="text-lg font-medium">Security & Compliance</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground dark:text-foreground">
                  <li>Real-time configuration drift detection</li>
                  <li>Compliance status monitoring against industry standards (CIS, HIPAA, PCI DSS)</li>
                  <li>Vulnerability assessment and risk scoring</li>
                  <li>Security posture visualization and improvement recommendations</li>
                </ul>
                
                <h3 className="text-lg font-medium">Cost Management</h3>
                <ul className="list-disc pl-6 space-y-1 text-foreground dark:text-foreground">
                  <li>AI-powered cost optimization recommendations</li>
                  <li>Resource right-sizing suggestions</li>
                  <li>Idle and underutilized resource identification</li>
                  <li>Cost anomaly detection with root cause analysis</li>
                  <li>Budget tracking and forecasting</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Connecting Cloud Providers</CardTitle>
                <CardDescription>
                  How to connect your cloud accounts with InfraAudit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground dark:text-foreground">
                  InfraAudit supports seamless integration with all major cloud providers. Follow the instructions below
                  to connect your cloud accounts and start monitoring your infrastructure.
                </p>
                
                <h3 className="text-lg font-medium mb-3">Supported Cloud Providers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 p-1 rounded mr-2">AWS</span> 
                      Amazon Web Services
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect using IAM credentials or cross-account IAM role
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View AWS Connection Guide
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 p-1 rounded mr-2">GCP</span> 
                      Google Cloud Platform
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect using Service Account key or OAuth 2.0
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View GCP Connection Guide
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 p-1 rounded mr-2">Azure</span> 
                      Microsoft Azure
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect using Service Principal or Managed Identity
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Azure Connection Guide
                    </Button>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium">Required Permissions</h3>
                <p className="mb-3 text-foreground dark:text-foreground">
                  InfraAudit requires the following minimum permissions to effectively monitor and analyze your cloud infrastructure:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground dark:text-foreground">
                  <li>Read-only access to resource inventory and configurations</li>
                  <li>Access to billing and cost data</li>
                  <li>Permissions to read logs and monitoring metrics</li>
                  <li>Optional: permissions to apply recommended changes (for automated remediation)</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
                <CardDescription>
                  How InfraAudit protects your cloud infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground dark:text-foreground">
                  InfraAudit continuously monitors your cloud resources for security issues, configuration drifts, and compliance violations.
                  Our platform helps identify and remediate security risks before they can be exploited.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>
                  How InfraAudit helps reduce your cloud spending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground dark:text-foreground">
                  InfraAudit's AI-powered cost optimization engine analyzes your resource usage patterns and identifies opportunities to reduce cloud spending without impacting performance.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Documentation;