import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Code, 
  FileText, 
  HardDrive, 
  Shield, 
  Database, 
  BarChart3, 
  Cloud
} from "lucide-react";

export default function Documentation() {
  return (
    <div className="container py-8 px-4 md:px-6 mx-auto max-w-7xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">CloudGuard Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive guides and resources to help you monitor and optimize your cloud infrastructure
          </p>
        </div>

        <Tabs defaultValue="guides" className="space-y-6">
          <TabsList className="bg-background/90 border border-border/40">
            <TabsTrigger value="guides" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Code className="h-4 w-4 mr-2" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="resources" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-primary" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Learn how to set up CloudGuard and connect your first cloud provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="#setup" className="text-primary hover:underline">Platform overview</a>
                    </li>
                    <li>
                      <a href="#account" className="text-primary hover:underline">Creating an account</a>
                    </li>
                    <li>
                      <a href="#connect" className="text-primary hover:underline">Connecting cloud providers</a>
                    </li>
                    <li>
                      <a href="#firstscan" className="text-primary hover:underline">Running your first scan</a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Cost Optimization
                  </CardTitle>
                  <CardDescription>
                    Identify and reduce unnecessary cloud infrastructure costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="#costoverview" className="text-primary hover:underline">Cost monitoring overview</a>
                    </li>
                    <li>
                      <a href="#anomalies" className="text-primary hover:underline">Detecting cost anomalies</a>
                    </li>
                    <li>
                      <a href="#reserved" className="text-primary hover:underline">Reserved instance recommendations</a>
                    </li>
                    <li>
                      <a href="#rightsizing" className="text-primary hover:underline">Resource rightsizing</a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security Monitoring
                  </CardTitle>
                  <CardDescription>
                    Enhance your cloud security and mitigate risks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="#security101" className="text-primary hover:underline">Security best practices</a>
                    </li>
                    <li>
                      <a href="#drifts" className="text-primary hover:underline">Configuration drift detection</a>
                    </li>
                    <li>
                      <a href="#compliance" className="text-primary hover:underline">Compliance monitoring</a>
                    </li>
                    <li>
                      <a href="#remediation" className="text-primary hover:underline">Automated remediation</a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions about using CloudGuard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What permissions does CloudGuard need for my cloud account?</AccordionTrigger>
                    <AccordionContent>
                      CloudGuard requires read-only permissions for most operations. For specific services like AWS, we recommend using the AWS ReadOnlyAccess policy. For remediation actions, additional permissions would be required, which are detailed in our security documentation.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>How does CloudGuard secure my cloud credentials?</AccordionTrigger>
                    <AccordionContent>
                      Your cloud credentials are encrypted using industry-standard AES-256 encryption before being stored in our database. We never store credentials in plaintext, and all communications are secured via TLS/SSL.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How often does CloudGuard scan my infrastructure?</AccordionTrigger>
                    <AccordionContent>
                      By default, CloudGuard scans your infrastructure every 6 hours. You can adjust this frequency in your account settings, with options ranging from hourly to daily scans. You can also trigger manual scans at any time.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Does CloudGuard support multi-cloud environments?</AccordionTrigger>
                    <AccordionContent>
                      Yes, CloudGuard fully supports multi-cloud environments, including AWS, Google Cloud Platform, and Microsoft Azure. You can connect and monitor multiple cloud providers simultaneously and get unified visibility across your entire infrastructure.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>
                  Integrate with CloudGuard using our RESTful API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      All API requests must be authenticated using an API key. You can generate an API key in your account settings.
                    </p>
                    <div className="bg-muted text-sm p-4 rounded-md font-mono">
                      <p>curl -X GET "https://api.cloudguard.com/resources" \</p>
                      <p>  -H "Authorization: Bearer YOUR_API_KEY"</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Endpoints</h3>
                    <p className="text-sm text-muted-foreground">
                      The CloudGuard API provides endpoints for resources, security drifts, cost anomalies, and more.
                    </p>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>GET /api/resources</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Returns a list of all resources in your connected cloud accounts.
                          </p>
                          <div className="bg-muted text-sm p-4 rounded-md font-mono">
                            <p>curl -X GET "https://api.cloudguard.com/resources" \</p>
                            <p>  -H "Authorization: Bearer YOUR_API_KEY"</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>GET /api/security-drifts</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Returns a list of all detected security configuration drifts.
                          </p>
                          <div className="bg-muted text-sm p-4 rounded-md font-mono">
                            <p>curl -X GET "https://api.cloudguard.com/security-drifts" \</p>
                            <p>  -H "Authorization: Bearer YOUR_API_KEY"</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>GET /api/cost-anomalies</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            Returns a list of all detected cost anomalies.
                          </p>
                          <div className="bg-muted text-sm p-4 rounded-md font-mono">
                            <p>curl -X GET "https://api.cloudguard.com/cost-anomalies" \</p>
                            <p>  -H "Authorization: Bearer YOUR_API_KEY"</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                    Cloud Resources
                  </CardTitle>
                  <CardDescription>
                    Documentation for supported cloud resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="#ec2" className="text-primary hover:underline">Amazon EC2 Instances</a>
                    </li>
                    <li>
                      <a href="#s3" className="text-primary hover:underline">Amazon S3 Buckets</a>
                    </li>
                    <li>
                      <a href="#rds" className="text-primary hover:underline">Amazon RDS Databases</a>
                    </li>
                    <li>
                      <a href="#gce" className="text-primary hover:underline">Google Compute Engine</a>
                    </li>
                    <li>
                      <a href="#gcs" className="text-primary hover:underline">Google Cloud Storage</a>
                    </li>
                    <li>
                      <a href="#azure-vm" className="text-primary hover:underline">Azure Virtual Machines</a>
                    </li>
                    <li>
                      <a href="#azure-storage" className="text-primary hover:underline">Azure Storage Accounts</a>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Technical Whitepapers
                  </CardTitle>
                  <CardDescription>
                    In-depth technical documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="#ml-algorithms" className="text-primary hover:underline">Machine Learning for Anomaly Detection</a>
                    </li>
                    <li>
                      <a href="#security-model" className="text-primary hover:underline">CloudGuard Security Architecture</a>
                    </li>
                    <li>
                      <a href="#cost-analysis" className="text-primary hover:underline">Advanced Cost Analysis Methodology</a>
                    </li>
                    <li>
                      <a href="#multi-cloud" className="text-primary hover:underline">Multi-Cloud Management Best Practices</a>
                    </li>
                    <li>
                      <a href="#compliance" className="text-primary hover:underline">Regulatory Compliance Framework</a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}