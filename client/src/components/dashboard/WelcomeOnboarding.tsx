import React from "react";
import { useLocation } from "wouter";
import { CloudIcon, Server, BarChart3, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiAmazonwebservices, SiGooglecloud } from "react-icons/si";

interface WelcomeOnboardingProps {
  onCloudIntegrationClick: () => void;
}

export function WelcomeOnboarding({ onCloudIntegrationClick }: WelcomeOnboardingProps) {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Welcome to InfraAudit
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
            Let's set up your infrastructure monitoring to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                  <CloudIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium">Connect Providers</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Connect your cloud providers to monitor resources
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                  <Server className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-medium">Scan Resources</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Automatically scan your cloud resources for issues
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-medium">Get Insights</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Receive AI-powered insights and optimization recommendations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={onCloudIntegrationClick}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Connect Your First Cloud Provider
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Supported Cloud Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Cloud Providers</CardTitle>
          <CardDescription>
            Connect your infrastructure from any major cloud provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <SiAmazonwebservices className="h-10 w-10 text-orange-500" />
              <div>
                <h3 className="font-medium">Amazon Web Services</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  EC2, S3, RDS, Lambda and more
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <SiGooglecloud className="h-10 w-10 text-blue-500" />
              <div>
                <h3 className="font-medium">Google Cloud Platform</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Compute Engine, GCS, BigQuery and more
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <CloudIcon className="h-10 w-10 text-blue-600" />
              <div>
                <h3 className="font-medium">Microsoft Azure</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  VMs, Storage, Databases and more
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Optimize Your Infrastructure</CardTitle>
          <CardDescription>
            InfraAudit provides powerful tools to help you manage and optimize your cloud resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-md h-fit">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Cost Optimization</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Identify cost saving opportunities with AI-powered recommendations. Find unused resources, right-size instances, and optimize reserved capacity.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-md h-fit">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Security Monitoring</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Detect security configuration drifts and vulnerabilities across your infrastructure. Get actionable remediation steps for each issue.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}