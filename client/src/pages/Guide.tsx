import React from "react";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  BookOpen,
  Cloud as CloudIcon,
  Shield,
  Bell,
  LineChart,
  Rocket,
  ArrowRight,
} from "lucide-react";

export default function Guide() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/documentation">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Getting Started</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
            <p className="text-muted-foreground mt-1">
              Set up InfraAudit in minutes: connect providers, view dashboards, and enable alerts.
            </p>
          </div>
          <Button asChild>
            <a href="/documentation" className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Full Documentation
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* TOC */}
        <aside className="md:col-span-3 lg:col-span-3">
          <div className="sticky top-24">
            <div className="text-xs uppercase text-muted-foreground mb-2">On this page</div>
            <nav className="space-y-2 text-sm">
              <a className="block hover:text-foreground text-muted-foreground" href="#account">Create account</a>
              <a className="block hover:text-foreground text-muted-foreground" href="#connect">Connect providers</a>
              <a className="block hover:text-foreground text-muted-foreground" href="#dashboard">Explore dashboard</a>
              <a className="block hover:text-foreground text-muted-foreground" href="#alerts">Set up alerts</a>
              <a className="block hover:text-foreground text-muted-foreground" href="#optimize">Optimize spend</a>
              <a className="block hover:text-foreground text-muted-foreground" href="#next-steps">Next steps</a>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <section className="md:col-span-9 lg:col-span-9 space-y-6">
          <Card id="account">
            <CardHeader>
              <CardTitle>1. Create an account and sign in</CardTitle>
              <CardDescription>Start your 14‑day trial and access your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground dark:text-foreground">
                Visit the authentication page to sign up and sign in. You can invite teammates later from Settings.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="default">
                  <a href="/auth" className="inline-flex items-center gap-2">
                    <Rocket className="h-4 w-4" /> Start Free Trial
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card id="connect">
            <CardHeader>
              <CardTitle>2. Connect your cloud providers</CardTitle>
              <CardDescription>Read‑only integrations; no changes made without your approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-card">
                  <h4 className="font-medium flex items-center gap-2"><CloudIcon className="h-4 w-4 text-primary" /> AWS</h4>
                  <p className="text-sm text-muted-foreground mb-3">Connect using IAM role or access keys</p>
                  <Button asChild variant="outline" size="sm" className="w-full"><a href="/cloud-providers">Open setup</a></Button>
                </div>
                <div className="border rounded-lg p-4 bg-card">
                  <h4 className="font-medium flex items-center gap-2"><CloudIcon className="h-4 w-4 text-primary" /> GCP</h4>
                  <p className="text-sm text-muted-foreground mb-3">Connect using Service Account key</p>
                  <Button asChild variant="outline" size="sm" className="w-full"><a href="/cloud-providers">Open setup</a></Button>
                </div>
                <div className="border rounded-lg p-4 bg-card">
                  <h4 className="font-medium flex items-center gap-2"><CloudIcon className="h-4 w-4 text-primary" /> Azure</h4>
                  <p className="text-sm text-muted-foreground mb-3">Connect using Service Principal</p>
                  <Button asChild variant="outline" size="sm" className="w-full"><a href="/cloud-providers">Open setup</a></Button>
                </div>
              </div>
              <Alert>
                <AlertTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Least‑privilege</AlertTitle>
                <AlertDescription>
                  We only request read‑only permissions by default. You can enable write scopes later for automated remediation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card id="dashboard">
            <CardHeader>
              <CardTitle>3. Explore your dashboard</CardTitle>
              <CardDescription>Security, cost, and utilization insights at a glance</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Security</h4>
                <p className="text-sm text-muted-foreground mb-3">Configuration drift and findings</p>
                <Button asChild variant="outline" size="sm"><a href="/security">Open Security</a></Button>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2"><LineChart className="h-4 w-4 text-primary" /> Costs</h4>
                <p className="text-sm text-muted-foreground mb-3">Trends and recommendations</p>
                <Button asChild variant="outline" size="sm"><a href="/cost">Open Costs</a></Button>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2"><LineChart className="h-4 w-4 text-primary" /> Forecasts</h4>
                <p className="text-sm text-muted-foreground mb-3">Predict future spend</p>
                <Button asChild variant="outline" size="sm"><a href="/cost-prediction">Open Forecasts</a></Button>
              </div>
            </CardContent>
          </Card>

          <Card id="alerts">
            <CardHeader>
              <CardTitle>4. Set up notifications</CardTitle>
              <CardDescription>Send alerts to Slack and configure thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground dark:text-foreground">Enable Slack notifications from Settings and choose which events should notify your channels.</p>
              <div className="flex gap-3">
                <Button asChild variant="outline"><a href="/settings" className="inline-flex items-center gap-2"><Bell className="h-4 w-4" /> Open Settings</a></Button>
              </div>
            </CardContent>
          </Card>

          <Card id="optimize">
            <CardHeader>
              <CardTitle>5. Optimize spend</CardTitle>
              <CardDescription>Rightsize, remove idle, and plan commitments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground dark:text-foreground">Use Cost Optimization and Forecasting to identify savings opportunities without impacting performance.</p>
              <div className="flex gap-3">
                <Button asChild variant="default"><a href="/cost" className="inline-flex items-center gap-2">Open Optimization <ArrowRight className="h-4 w-4" /></a></Button>
                <Button asChild variant="outline"><a href="/cost-prediction">View Forecasts</a></Button>
              </div>
            </CardContent>
          </Card>

          <div id="next-steps" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Next: Explore the API</CardTitle>
                <CardDescription>Programmatically access costs, security findings, and utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild><a href="/api">Open API Reference</a></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Learn more</CardTitle>
                <CardDescription>Deep dive into features and workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline"><a href="/documentation">View Full Docs</a></Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

