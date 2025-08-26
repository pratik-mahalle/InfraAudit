import React from 'react';
import { Helmet } from 'react-helmet';
import { Zap, Award, Users, BarChart4, Shield, Cloud, Check, Quote } from 'lucide-react';
import founderPhoto from '../assets/founder.jpg'; // Adjust the path as necessary

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About InfrAudit | Multi-Cloud Infrastructure Monitoring</title>
        <meta name="description" content="Learn about InfrAudit, a comprehensive multi-cloud infrastructure monitoring platform leveraging AI for intelligent insights, proactive anomaly detection, and simplified management." />
      </Helmet>

      <div className="container max-w-6xl mx-auto py-12 px-4 md:px-6">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Zap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">About InfrAudit</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The intelligent cloud cost optimization and security platform that helps you take control of your multi-cloud infrastructure.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Our Mission</h2>
          <div className="bg-muted/50 rounded-lg p-8">
            <p className="text-lg">
              InfrAudit is on a mission to give businesses complete visibility and control over their cloud environments. 
              We believe that organizations should be able to harness the full power of multi-cloud environments without dealing 
              with runaway costs, security vulnerabilities, or operational chaos. Our AI-powered platform makes cloud complexity 
              manageable—with automated monitoring, intelligent recommendations, and a unified view of your entire cloud ecosystem.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Why Businesses Choose InfrAudit</h2>
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
                It all started with a simple observation: cloud bills were rising, and no one really knew why. As engineers building and scaling infrastructure, we kept noticing the same pattern — unused resources, misconfigured setups, and teams struggling to understand their cloud costs.
              </p>
              <p className="text-lg mb-4">
                So we asked ourselves: What if we could fix this?
              </p>
              <p className="text-lg mb-4">
                That's how InfrAudit was born.
              </p>
              <p className="text-lg mb-4">
                InfrAudit is more than a dashboard. It's a smart platform built to automatically detect cloud waste, offer actionable insights, and help teams save money — without slowing down innovation.
              </p>
              <p className="text-lg mb-4">
                We're using modern technologies like TypeScript, Node.js, and NeonDB to build a fast, scalable, and developer-first platform that helps engineering and finance teams stay in sync.
              </p>
              <p className="text-lg">
                We're still early in our journey, but our mission is clear:
                Help every company take control of their cloud spend and grow efficiently.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-8">
              <div className="flex flex-col items-center justify-center h-full">
                <Award className="h-16 w-16 text-blue-600 mb-6" />
                <p className="text-center font-medium text-xl mb-4">Join us as we build the future of cloud cost intelligence.</p>
                <div className="grid grid-cols-2 gap-4 w-full mt-2">
                  <div className="bg-background p-4 rounded-lg border border-border/50 text-center">
                    <p className="text-3xl font-bold text-blue-600 mb-2">32%</p>
                    <p className="text-sm text-muted-foreground">Average cost savings</p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border border-border/50 text-center">
                    <p className="text-3xl font-bold text-green-600 mb-2">10k+</p>
                    <p className="text-sm text-muted-foreground">Resources monitored</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team or Leadership */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-8">Leadership Team</h2>
          
          {/* Founder Featured Section */}
          <div className="mb-12 overflow-hidden relative">
            <div className="p-8 md:p-10 lg:p-12 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3">
                  <div className="relative group">
                    <div className="relative">
                      <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-[6px] border-background shadow-xl mx-auto 
                                  group-hover:scale-105 transition-transform duration-500 ease-out">
                        <img 
                          src={founderPhoto} 
                          alt="Pratik Mahalle" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs py-1 px-3 rounded-full shadow-lg
                              z-20 hover:scale-110 transition-transform duration-300">
                      Founder
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3 text-center md:text-left">
                  <div className="flex items-center mb-4">
                    <Quote className="h-10 w-10 text-blue-300 dark:text-blue-500 mr-2 shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold">Pratik Mahalle</h3>
                      <p className="text-blue-600 dark:text-blue-400">Founder & CEO</p>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-lg mb-4 pl-4 border-l-4 border-blue-300 dark:border-blue-500/50 italic">
                    Hi, I'm Pratik, Founder and DevOps Engineer behind InfrAudit — a cloud observability and security tool that eliminates hours of manual effort for cloud teams. With InfrAudit, we've automated compliance checks, surfaced critical misconfigurations, and reduced cloud overspend with smart, real-time insights. It's now an operational prototype and actively evolving into a must-have tool for modern DevOps and FinOps workflows
                  </p>
                  
                  <div className="mt-6 flex flex-wrap gap-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                      DevOps Engineer
                    </span>
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm">
                      DevRel
                    </span>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                      Cloud Infrastructure Expert
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </>
  );
}