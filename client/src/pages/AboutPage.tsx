import React from 'react';
import { Helmet } from 'react-helmet';
import { Shield, Award, Users, BarChart4 } from 'lucide-react';

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
            <Shield className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">About InfraAudit</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive multi-cloud infrastructure monitoring platform leveraging AI to provide intelligent insights, proactive anomaly detection, and simplified management.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Our Mission</h2>
          <div className="bg-muted/50 rounded-lg p-8">
            <p className="text-lg">
              At InfraAudit, our mission is to simplify the complexity of cloud infrastructure management. We believe that 
              organizations should be able to harness the full power of multi-cloud environments without the overhead of 
              manual monitoring, security concerns, or unexpected costs. By providing real-time visibility, proactive anomaly detection, 
              and actionable recommendations, we help businesses optimize their cloud infrastructure, minimize risks, 
              and maximize ROI.
            </p>
          </div>
        </div>

        {/* Features & Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Why Choose InfraAudit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <BarChart4 className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Cost Optimization</h3>
              </div>
              <p className="text-muted-foreground">
                Identify cost anomalies, optimize resource usage, and receive actionable recommendations to reduce your cloud spending.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold">Security Monitoring</h3>
              </div>
              <p className="text-muted-foreground">
                Detect security configuration drifts, identify vulnerabilities, and ensure compliance across all your cloud resources.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold">Multi-Cloud Support</h3>
              </div>
              <p className="text-muted-foreground">
                Manage AWS, Azure, Google Cloud, and Kubernetes workloads from a single unified dashboard with consistent workflows.
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
                InfraAudit was founded in 2023 by a team of cloud infrastructure experts who experienced firsthand the challenges of 
                managing complex multi-cloud environments. We noticed that organizations were struggling with visibility across clouds, 
                unexpected cost spikes, and security vulnerabilities that often went undetected until it was too late.
              </p>
              <p className="text-lg mb-4">
                We set out to build a solution that would provide real-time insights and proactive recommendations, leveraging 
                the power of AI to detect anomalies before they become problems. Today, InfraAudit helps organizations of all sizes 
                optimize their cloud infrastructure, reduce costs, and strengthen their security posture.
              </p>
              <p className="text-lg">
                Our team of cloud engineers, security experts, and data scientists continually enhances our platform to address the 
                evolving challenges of modern cloud infrastructure management.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-6">
              <div className="flex flex-col items-center justify-center h-full">
                <Award className="h-16 w-16 text-blue-600 mb-4" />
                <p className="text-center font-medium text-xl mb-2">Trusted by organizations worldwide</p>
                <p className="text-center text-muted-foreground">
                  Monitoring over 10,000 cloud resources and helping companies save an average of 32% on their cloud bills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team or Leadership */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-8">Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">Alex Johnson</h3>
              <p className="text-muted-foreground mb-2">CEO & Co-Founder</p>
              <p className="text-sm text-center text-muted-foreground">
                Former Cloud Architect at AWS with 15 years of experience in cloud infrastructure and DevOps.
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">Sarah Chen</h3>
              <p className="text-muted-foreground mb-2">CTO & Co-Founder</p>
              <p className="text-sm text-center text-muted-foreground">
                Security expert with background in cloud-native technology and 12 years at Microsoft Azure.
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">Michael Okonjo</h3>
              <p className="text-muted-foreground mb-2">Chief AI Officer</p>
              <p className="text-sm text-center text-muted-foreground">
                PhD in Machine Learning with focus on anomaly detection and pattern recognition in large datasets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}