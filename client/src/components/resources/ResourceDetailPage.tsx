import React from "react";
import { Helmet } from "react-helmet";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  CalendarClock,
  Cloud,
  CloudOff,
  Database,
  ExternalLink,
  HardDrive,
  KeyRound,
  Loader2,
  MapPin,
  Network,
  Server,
  Shield,
  UserRound,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AiAnalysisPanel } from "@/components/ai/AiAnalysisPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResource } from "@/hooks/use-resources";
import { formatResourceType, parseResourceConfiguration } from "@/lib/resource-display";

function resourceIcon(type: string) {
  switch (type.toLowerCase()) {
    case "ec2-instance": return Server;
    case "rds-instance": return Database;
    case "s3-bucket":
    case "ebs-volume": return HardDrive;
    case "vpc": return Network;
    case "security-group": return Shield;
    case "iam-user": return UserRound;
    case "iam-role": return KeyRound;
    default: return Cloud;
  }
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function DetailField({ label, value, mono = false }: { label: string; value: unknown; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 whitespace-pre-wrap break-words text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {displayValue(value)}
      </div>
    </div>
  );
}

export default function ResourceDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const resourceId = id ? decodeURIComponent(id) : "";
  const { data: resource, isLoading, error } = useResource(resourceId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !resource) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <CloudOff className="mb-4 h-14 w-14 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Resource details unavailable</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            {error instanceof Error ? error.message : "This resource could not be found in the current organization inventory."}
          </p>
          <Button variant="outline" className="mt-5" onClick={() => navigate("/resources")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to resources
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = resourceIcon(resource.type);
  const configuration = parseResourceConfiguration(resource.configuration);
  const configTags = configuration.tags && typeof configuration.tags === "object" && !Array.isArray(configuration.tags)
    ? configuration.tags as Record<string, string>
    : {};
  const tags = resource.tags ?? configTags;
  const configurationEntries = Object.entries(configuration).filter(([key]) => key !== "tags");
  const isActive = ["active", "running", "available"].includes(resource.status.toLowerCase());

  return (
    <DashboardLayout>
      <Helmet><title>{resource.name} | InfraAudit</title></Helmet>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/resources")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to resources
        </Button>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-xl border bg-primary/5 p-3 text-primary"><Icon className="h-6 w-6" /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-bold tracking-tight md:text-3xl">{resource.name}</h1>
                <Badge variant="secondary">{formatResourceType(resource.type)}</Badge>
                <Badge variant={isActive ? "outline" : "destructive"}>{titleCase(resource.status)}</Badge>
              </div>
              <p className="mt-2 break-all font-mono text-sm text-muted-foreground">{resource.resourceId}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/drift-detection")}>
            <Shield className="mr-2 h-4 w-4" /> View security findings <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DetailField label="Provider" value={resource.provider.toUpperCase()} />
          <DetailField label="Region" value={resource.region || "Global"} />
          <DetailField label="Inventory status" value={titleCase(resource.status)} />
          <DetailField label="Monthly cost" value={resource.cost == null ? "Not imported" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(resource.cost)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Resource identity</CardTitle>
                  <CardDescription>Canonical inventory information collected from AWS.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Resource name" value={resource.name} />
                  <DetailField label="Resource type" value={formatResourceType(resource.type)} />
                  <DetailField label="Cloud identifier" value={resource.resourceId} mono />
                  <DetailField label="Location" value={resource.region || "Global"} />
                  <DetailField label="Discovered" value={resource.createdAt ? new Date(resource.createdAt).toLocaleString() : undefined} />
                  <DetailField label="Last updated" value={resource.updatedAt ? new Date(resource.updatedAt).toLocaleString() : undefined} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>Cloud tags captured during the latest inventory sync.</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(tags).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(tags).map(([key, value]) => <Badge key={key} variant="secondary">{key}: {value}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No tags were returned for this resource.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuration" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cloud configuration</CardTitle>
                  <CardDescription>Provider-native attributes captured during the latest synchronization.</CardDescription>
                </CardHeader>
                <CardContent>
                  {configurationEntries.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {configurationEntries.map(([key, value]) => (
                        <DetailField key={key} label={titleCase(key)} value={value} mono={typeof value === "object"} />
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No configuration payload is available yet. Run Sync &amp; scan to refresh it.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Raw inventory record</CardTitle></CardHeader>
                <CardContent>
                  <pre className="max-h-[560px] overflow-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify({ ...resource, configuration }, null, 2)}</pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Operational context</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><div className="font-medium">Coverage</div><div className="text-muted-foreground">Monitored in {resource.region || "the global AWS scope"}.</div></div></div>
                <div className="flex items-start gap-3"><CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><div className="font-medium">Inventory freshness</div><div className="text-muted-foreground">{resource.updatedAt ? `Updated ${new Date(resource.updatedAt).toLocaleString()}.` : "Refresh time is not available."}</div></div></div>
                <div className="flex items-start gap-3"><Shield className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><div className="font-medium">Security evaluation</div><div className="text-muted-foreground">Drift and policy findings are tracked separately and linked to this cloud identifier.</div></div></div>
              </CardContent>
            </Card>
            <AiAnalysisPanel resourceId={resource.resourceId ?? resourceId} resourceName={resource.name} resourceType={resource.type} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
