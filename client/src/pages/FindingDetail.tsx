import { Link, useParams } from "wouter";
import { AlertTriangle, ArrowLeft, Fingerprint } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinding, useUpdateFindingStatus } from "@/hooks/use-findings";
import { useToast } from "@/hooks/use-toast";
import type { FindingStatus } from "@/lib/api";
import { FindingDetailPanel } from "@/components/findings/finding-ui";
import { EmptyPanel } from "@/components/security-ops/ops-ui";

export default function FindingDetail() {
  const { id } = useParams<{ id: string }>();
  const findingId = Number(id);
  const { toast } = useToast();
  const { data: finding, isLoading, isError, error } = useFinding(Number.isFinite(findingId) ? findingId : undefined);
  const updateStatus = useUpdateFindingStatus();

  const handleStatusChange = (status: FindingStatus) => {
    if (!finding) return;
    updateStatus.mutate(
      { id: finding.id, status },
      {
        onSuccess: () => toast({ title: "Finding updated", description: `Status changed to ${status.replace(/_/g, " ")}.` }),
        onError: (err: Error) => toast({ title: "Could not update finding", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={finding?.title || "Finding Detail"}
        description="Full evidence record, resource context, remediation, and lifecycle controls."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/security?view=findings">
              <ArrowLeft className="h-4 w-4" />
              Back to Findings
            </Link>
          </Button>
        }
      />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Evidence Record
          </CardTitle>
          <CardDescription>
            {finding ? `Finding #${finding.id} from ${finding.scannerType || finding.sourceType}` : "Loading finding evidence"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <EmptyPanel icon={Fingerprint} title="Loading finding" description="Fetching the full normalized evidence record." />
          ) : isError ? (
            <EmptyPanel icon={AlertTriangle} title="Could not load finding" description={error instanceof Error ? error.message : "The finding API returned an error."} />
          ) : (
            <FindingDetailPanel
              finding={finding}
              onStatusChange={handleStatusChange}
              isStatusPending={updateStatus.isPending}
              showLink={false}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
