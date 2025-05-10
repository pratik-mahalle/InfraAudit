import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { 
  Cloud, 
  Shield, 
  DollarSign, 
  Bell, 
  Server, 
  LineChart, 
  Settings,
  RefreshCw,
  Sparkles,
  Workflow,
  BookOpen,
  Layers,
  GitBranch,
  Code,
  Container
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/components/onboarding/OnboardingContext';

const Documentation = () => {
  const { restartTour } = useOnboarding();
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CloudGuard Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive guide to monitoring and optimizing your cloud infrastructure
            </p>
          </div>
          <Button 
            onClick={restartTour}
            className="gap-2"
          >
            <RefreshCw size={16} />
            <span>Start Interactive Tour</span>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding Tour</TabsTrigger>
            <TabsTrigger value="connection">Cloud Connection</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="costs">Cost Optimization</TabsTrigger>
            <TabsTrigger value="go-migration">Go Migration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>CloudGuard Platform Overview</CardTitle>
                <CardDescription>
                  A comprehensive multi-cloud infrastructure monitoring platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  CloudGuard is an intelligent infrastructure monitoring platform designed to help DevOps teams maintain 
                  infrastructure integrity and cost efficiency across multiple cloud providers including AWS, Azure, and GCP. 
                  The platform combines powerful monitoring capabilities with AI-powered insights to prevent security issues 
                  and reduce cloud spending.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <Card className="bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-base">Security Monitoring</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Detect security configuration drifts and compliance issues in your cloud infrastructure in real-time. 
                        Track deviations from your security baseline and get alerts before they become vulnerabilities.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <CardTitle className="text-base">Cost Optimization</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        AI-driven analysis to identify savings opportunities across your cloud environments. 
                        Get recommendations for right-sizing, reserved instances, and eliminating idle resources.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <CardTitle className="text-base">Multi-Cloud Support</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Unified visibility across AWS, Azure, and Google Cloud Platform from a single dashboard.
                        Standardized metrics and alerts regardless of your cloud provider mix.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <CardTitle className="text-base">Resource Utilization</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Track CPU, memory, storage, and network utilization across all your cloud resources.
                        Identify performance bottlenecks and optimize resource allocation.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <CardTitle className="text-base">Intelligent Alerting</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Configurable notifications for security issues and cost anomalies with Slack integration.
                        Smart alerting with context-aware detection to minimize false positives.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <CardTitle className="text-base">AI-Powered Insights</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Machine learning analysis to predict future costs and identify optimization opportunities.
                        Continuous learning that improves recommendations based on your usage patterns.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  Detailed overview of CloudGuard's capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Security Monitoring
                    </h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Real-time detection of security configuration drifts</li>
                      <li>Automated scanning against industry benchmarks (CIS, HIPAA, PCI-DSS)</li>
                      <li>Compliance reporting and remediation recommendations</li>
                      <li>Security posture visualization and trend analysis</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                      Cost Optimization
                    </h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>AI-powered cost reduction recommendations</li>
                      <li>Idle resource detection and elimination suggestions</li>
                      <li>Reserved instance and savings plan optimization</li>
                      <li>Cost anomaly detection with root cause analysis</li>
                      <li>Budget tracking and forecasting</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-green-600" />
                      Resource Utilization
                    </h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>CPU, memory, storage, and network usage monitoring</li>
                      <li>Performance bottleneck identification</li>
                      <li>Resource right-sizing recommendations</li>
                      <li>Historical utilization trends and patterns</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Bell className="h-5 w-5 text-red-600" />
                      Alert Management
                    </h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Configurable alert thresholds and notification channels</li>
                      <li>Slack integration for real-time alerts</li>
                      <li>Alert categorization by severity and type</li>
                      <li>Smart alert grouping to reduce notification fatigue</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="onboarding">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Interactive Onboarding Tour</CardTitle>
                    <CardDescription>
                      Guide to CloudGuard's interactive walkthrough
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">New Feature</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  CloudGuard features a comprehensive interactive onboarding tour guided by Cirrus, your cloud assistant mascot.
                  This tour will walk you through all the key features of the platform, ensuring you get the most out of your
                  cloud monitoring experience.
                </p>
                
                <h3 className="text-lg font-medium">Tour Features</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Guided walkthrough of all major CloudGuard sections</li>
                  <li>Automatic page navigation during the tour</li>
                  <li>Interactive UI elements with visual highlights</li>
                  <li>Friendly cloud mascot guide with contextual explanations</li>
                  <li>Tour can be paused, resumed, or restarted at any time</li>
                </ul>
                
                <h3 className="text-lg font-medium">Tour Steps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Welcome</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Introduction to CloudGuard and your cloud assistant Cirrus</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Dashboard Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Explore your unified cloud monitoring dashboard</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Cloud Providers</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Learn how to connect and manage your cloud accounts</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Security Monitoring</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Discover security configuration drifts and compliance issues</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Cost Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Find ways to reduce cloud spending with AI-powered recommendations</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Resource Utilization</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Track and optimize CPU, memory, storage, and network usage</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Alerts Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Configure notifications for security and cost issues</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-100">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Settings & Customization</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Tailor CloudGuard to your specific needs and preferences</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Restart the Tour Anytime</h4>
                      <p className="text-sm text-muted-foreground">
                        You can restart the interactive tour at any time by clicking the cloud mascot icon in the bottom right corner
                        of the screen and selecting "Restart Full Tour" from the menu.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Provider Connections</CardTitle>
                <CardDescription>
                  How to connect your cloud accounts to CloudGuard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  CloudGuard supports monitoring resources across all major cloud providers. Follow these guides
                  to connect your cloud accounts and start monitoring your infrastructure.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.19 2C3.48 2 1 4.84 1 9C1 13.2 3.5 16 7.19 16C10.9 16 13.39 13.2 13.39 9C13.39 4.84 10.9 2 7.19 2Z" fill="#FF9900"/>
                          <path d="M15.78 21.7898C18.52 21.7898 20.3 19.7198 20.3 16.9998C20.3 14.2898 18.52 12.2098 15.78 12.2098C13.05 12.2098 11.25 14.2898 11.25 16.9998C11.25 19.7198 13.05 21.7898 15.78 21.7898Z" fill="#FF9900"/>
                          <path d="M22.39 9.1901C22.39 12.0701 19.18 14.4001 15.13 14.4001C11.09 14.4001 7.89001 12.0701 7.89001 9.1901C7.89001 6.3101 11.09 4.0601 15.13 4.0601C19.18 4.0601 22.39 6.3101 22.39 9.1901Z" fill="#FF9900"/>
                        </svg>
                        AWS Connection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        Connect your AWS account using programmatic access credentials.
                      </p>
                      <h4 className="text-sm font-medium">Required Permissions:</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>EC2ReadOnlyAccess</li>
                        <li>S3ReadOnlyAccess</li>
                        <li>IAMReadOnlyAccess</li>
                        <li>CloudWatchReadOnlyAccess</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.9999 10.9999L14.9999 4.99988L8.99988 10.9999L14.9999 16.9999L20.9999 10.9999Z" fill="#00A4EF"/>
                          <path d="M14.9999 4.99988L8.99988 10.9999L2.99988 4.99988L8.99988 -0.00012207L14.9999 4.99988Z" fill="#5CD966"/>
                          <path d="M20.9999 10.9999L14.9999 16.9999L8.99988 22.9999L14.9999 16.9999L20.9999 10.9999Z" fill="#FDBD00"/>
                          <path d="M8.99988 10.9999L2.99988 16.9999L8.99988 22.9999L14.9999 16.9999L8.99988 10.9999Z" fill="#EA4036"/>
                        </svg>
                        Azure Connection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        Connect your Azure account using service principal credentials.
                      </p>
                      <h4 className="text-sm font-medium">Required Information:</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Client ID</li>
                        <li>Client Secret</li>
                        <li>Tenant ID</li>
                        <li>Subscription ID</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 11V8L7 13L12 18V15H16V11H12Z" fill="#EA4335"/>
                          <path d="M6 9L3 12L6 15V9Z" fill="#FBBC04"/>
                          <path d="M12 8V11H16V15H12V18L17 13L12 8Z" fill="#34A853"/>
                          <path d="M21 12L18 9V15L21 12Z" fill="#4285F4"/>
                        </svg>
                        GCP Connection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        Connect your Google Cloud Platform account using a service account key.
                      </p>
                      <h4 className="text-sm font-medium">Required Permissions:</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Compute Viewer</li>
                        <li>Storage Object Viewer</li>
                        <li>Monitoring Viewer</li>
                        <li>Service Account Key Admin</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
                <CardDescription>
                  How CloudGuard protects your cloud infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  CloudGuard continuously monitors your cloud resources for security issues, configuration drifts, and compliance violations.
                  Our platform helps identify and remediate security risks before they can be exploited.
                </p>
                
                <h3 className="text-lg font-medium">Security Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-950">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Configuration Drift Detection</h4>
                      <p className="text-sm text-muted-foreground">
                        Identify when resources deviate from your security baseline or best practices
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-950">
                      <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Compliance Monitoring</h4>
                      <p className="text-sm text-muted-foreground">
                        Check resources against industry frameworks like CIS, HIPAA, PCI DSS, and more
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-950">
                      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Real-time Alerts</h4>
                      <p className="text-sm text-muted-foreground">
                        Get immediate notifications when security issues are detected
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-950">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">Remediation Guidance</h4>
                      <p className="text-sm text-muted-foreground">
                        Step-by-step instructions to fix security issues and prevent future occurrences
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>
                  How CloudGuard helps reduce your cloud spending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  CloudGuard's AI-powered cost optimization engine analyzes your resource usage patterns and identifies opportunities to reduce cloud spending without impacting performance.
                </p>
                
                <h3 className="text-lg font-medium">Cost Optimization Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full dark:bg-amber-950">
                        <Server className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Right-sizing Recommendations</h4>
                        <p className="text-sm text-muted-foreground">
                          Identify over-provisioned resources and receive recommendations for more cost-effective instance types
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full dark:bg-amber-950">
                        <Workflow className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Reserved Instance Optimization</h4>
                        <p className="text-sm text-muted-foreground">
                          Recommendations for Reserved Instance purchases based on your usage patterns
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full dark:bg-amber-950">
                        <LineChart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Cost Anomaly Detection</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically detect unusual spending patterns and identify the root causes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-full dark:bg-amber-950">
                        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">AI-Driven Cost Prediction</h4>
                        <p className="text-sm text-muted-foreground">
                          Machine learning forecasts to predict future cloud costs based on historical patterns and growth trends
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="go-migration">
            <Card>
              <CardHeader>
                <CardTitle>Go Backend Migration</CardTitle>
                <CardDescription>
                  Information about the ongoing migration to Go microservices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  CloudGuard is in the process of migrating from a Node.js backend to a Go-based microservices architecture.
                  This migration will bring significant performance improvements, better type safety, and more efficient resource utilization.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-blue-600" />
                      Migration Strategy
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Parallel operation of Node.js and Go backends during transition</li>
                      <li>Gradual traffic shift to Go microservices as they are completed</li>
                      <li>Feature parity testing to ensure consistent functionality</li>
                      <li>Automated migration rollback capability if issues are detected</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Code className="h-5 w-5 text-blue-600" />
                      Go Backend Benefits
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Improved performance and reduced latency</li>
                      <li>Better type safety and fewer runtime errors</li>
                      <li>More efficient resource utilization and lower memory footprint</li>
                      <li>Simplified deployment with single binary executables</li>
                      <li>Built-in concurrency support with goroutines</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Container className="h-5 w-5 text-blue-600" />
                    Deployment Architecture
                  </h3>
                  <p className="mt-2">
                    The new Go backend is deployed using Kubernetes with the following components:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>deployment.yaml: Core application deployment configuration</li>
                    <li>service.yaml: Internal networking and service discovery</li>
                    <li>ingress.yaml: External access and routing rules</li>
                    <li>secrets.yaml: Secure storage for sensitive configuration</li>
                    <li>configmap.yaml: Non-sensitive configuration parameters</li>
                    <li>hpa.yaml: Horizontal Pod Autoscaler for dynamic scaling</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50">
                  <h4 className="font-medium">Migration Status</h4>
                  <p className="text-sm mt-1">
                    The migration is currently in progress, with approximately 60% of the backend functionality
                    already migrated to Go microservices. The full migration is expected to be completed within
                    the next two months, with no interruption to service during the transition.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Documentation;