import React from 'react';
import { Helmet } from 'react-helmet';
import { Zap, Award, Users, BarChart4, Shield, Cloud, Check } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About InfraAudit | Multi-Cloud Infrastructure Monitoring</title>
        <meta name="description" content="Learn about InfraAudit, a comprehensive multi-cloud infrastructure monitoring platform leveraging AI for intelligent insights, proactive anomaly detection, and simplified management." />
      </Helmet>

      <div className="container max-w-6xl mx-auto py-12 px-4 md:px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Zap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">About InfraAudit</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The intelligent cloud cost optimization and security platform that helps you take control of your multi-cloud infrastructure.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Our Mission</h2>
          <div className="bg-muted/50 rounded-lg p-8">
            <p className="text-lg">
              InfraAudit is on a mission to give businesses complete visibility and control over their cloud environments. 
              We believe that organizations should be able to harness the full power of multi-cloud environments without dealing 
              with runaway costs, security vulnerabilities, or operational chaos. Our AI-powered platform makes cloud complexity 
              manageable—with automated monitoring, intelligent recommendations, and a unified view of your entire cloud ecosystem.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Why Businesses Choose InfraAudit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Reduce Cloud Costs by 30%+</h3>
                  <p className="text-muted-foreground">
                    Our automated cost optimization engine identifies wasteful spending and recommends immediate actions to reduce your cloud bill.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Prevent Security Breaches</h3>
                  <p className="text-muted-foreground">
                    Continuous security scanning detects vulnerabilities and misconfigurations before they can be exploited.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Unify Multi-Cloud Management</h3>
                  <p className="text-muted-foreground">
                    Single dashboard to manage AWS, Azure, Google Cloud, and Kubernetes resources with consistent policies and controls.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
                  <p className="text-muted-foreground">
                    Machine learning algorithms continuously analyze your infrastructure to predict issues and recommend optimizations.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fast Time-to-Value</h3>
                  <p className="text-muted-foreground">
                    Connect your cloud accounts in minutes, not days. See valuable insights and start saving immediately.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Architecture Design</h3>
                  <p className="text-muted-foreground">
                    Drag-and-drop cloud architecture designer helps you plan and optimize your infrastructure before deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Solutions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Our Key Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <BarChart4 className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Cost Optimization</h3>
              </div>
              <p className="text-muted-foreground">
                Automatically identify idle resources, right-size instances, and get actionable recommendations to cut wasteful spending.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold">Security Monitoring</h3>
              </div>
              <p className="text-muted-foreground">
                Continuous scanning for misconfigurations, compliance violations, and security vulnerabilities with prioritized remediation guidance.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <Cloud className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold">Multi-Cloud Management</h3>
              </div>
              <p className="text-muted-foreground">
                Unified dashboard for AWS, Azure, Google Cloud, and Kubernetes with standardized policies and complete visibility.
              </p>
            </div>
          </div>
        </div>

        {/* Company Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Our Story</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg mb-4">
                InfraAudit was born from frustration. Our founders were managing cloud infrastructure for Fortune 500 companies
                and struggling with the same challenges: unexpected cost overruns, security vulnerabilities discovered too late, 
                and the growing complexity of multi-cloud environments.
              </p>
              <p className="text-lg mb-4">
                They realized that existing tools were disconnected, requiring teams to use dozens of separate dashboards and tools 
                to get a complete picture. So in 2023, they set out to build a comprehensive solution that would unify cloud management 
                and leverage AI to provide truly useful insights and automations.
              </p>
              <p className="text-lg">
                Today, InfraAudit helps organizations of all sizes gain control over their cloud environments, typically reducing costs 
                by 30% or more while strengthening security and streamlining operations.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-6">
              <div className="flex flex-col items-center justify-center h-full">
                <Award className="h-16 w-16 text-blue-600 mb-4" />
                <p className="text-center font-medium text-xl mb-2">Making an Impact</p>
                <p className="text-center text-muted-foreground">
                  Monitoring over 10,000 cloud resources across AWS, Azure, GCP and Kubernetes environments, helping companies save an average of 32% on their cloud bills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team or Leadership */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-8">Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">Sarah Chen</h3>
              <p className="text-muted-foreground mb-2">CEO & Co-Founder</p>
              <p className="text-sm text-center text-muted-foreground">
                Former Cloud Architect at AWS with 15+ years of experience in cloud infrastructure and security. Led cloud transformation for Fortune 100 companies.
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">Alex Johnson</h3>
              <p className="text-muted-foreground mb-2">CTO & Co-Founder</p>
              <p className="text-sm text-center text-muted-foreground">
                Machine learning expert and cloud optimization specialist with 10+ years at Google Cloud. Pioneer in applying AI to infrastructure management.
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">Michael Okonjo</h3>
              <p className="text-muted-foreground mb-2">Chief Product Officer</p>
              <p className="text-sm text-center text-muted-foreground">
                PhD in Machine Learning with 8+ years of product leadership at cloud-native companies. Passionate about solving complex infrastructure challenges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}