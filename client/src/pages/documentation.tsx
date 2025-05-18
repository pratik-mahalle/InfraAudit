import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { 
  Cloud, 
  Shield, 
  DollarSign, 
  Bell, 
  Server, 
  LineChart, 
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
                  A comprehensive multi-cloud infrastructure monitoring platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  InfraAudit is an intelligent infrastructure monitoring platform designed to help DevOps teams maintain 
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  Detailed overview of InfraAudit's capabilities
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          

          
          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Provider Connections</CardTitle>
                <CardDescription>
                  How to connect your cloud accounts to InfraAudit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
                  InfraAudit supports monitoring resources across all major cloud providers. Follow these guides
                  to connect your cloud accounts and start monitoring your infrastructure.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AWS Connection</CardTitle>
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
                      <CardTitle className="text-base">Azure Connection</CardTitle>
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
                      <CardTitle className="text-base">GCP Connection</CardTitle>
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
                  How InfraAudit protects your cloud infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p>
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
                <p>
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