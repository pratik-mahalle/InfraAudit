import React, { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
    useJobs,
    useCreateJob,
    useDeleteJob,
    useTriggerJob,
    usePendingApprovals,
    useApproveRemediation,
    useExecuteRemediation
} from "@/hooks/use-jobs";
import { JobsList } from "@/components/automation/JobsList";
import { RemediationQueue } from "@/components/automation/RemediationQueue";
import { JobScheduler } from "@/components/automation/JobScheduler";
import { useToast } from "@/hooks/use-toast";

export default function Automation() {
    const { toast } = useToast();

    // Jobs Data
    const { data: jobs, isLoading: isLoadingJobs } = useJobs();
    const { mutate: createJob } = useCreateJob();
    const { mutate: deleteJob } = useDeleteJob();
    const { mutate: triggerJob } = useTriggerJob();

    // Remediation Data
    const { data: pendingApprovals, isLoading: isLoadingApprovals } = usePendingApprovals();
    const { mutate: approveRemediation } = useApproveRemediation();

    const handleCreateJob = (job: any) => {
        createJob(job, {
            onSuccess: () => toast({ title: "Job Scheduled", description: `${job.name} has been created.` }),
            onError: () => toast({ title: "Error", description: "Failed to create job.", variant: "destructive" })
        });
    };

    const handleRunJob = (id: string) => {
        triggerJob(id, {
            onSuccess: () => toast({ title: "Job Triggered", description: "Job execution started." }),
            onError: () => toast({ title: "Error", description: "Failed to run job.", variant: "destructive" })
        });
    };

    const handleDeleteJob = (id: string) => {
        if (confirm("Are you sure you want to delete this job?")) {
            deleteJob(id, {
                onSuccess: () => toast({ title: "Job Deleted", description: "Scheduled job removed." })
            });
        }
    };

    const handleApprove = (id: string) => {
        approveRemediation(id, {
            onSuccess: () => toast({ title: "Action Approved", description: "Remediation action is being executed." }),
            onError: () => toast({ title: "Error", description: "Failed to approve action.", variant: "destructive" })
        });
    };

    return (
        <DashboardLayout>
            <PageHeader
                title="Automation & Remediation"
                description="Schedule compliance scans and manage auto-remediation tasks."
            />

            <Tabs defaultValue="jobs" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
                    <TabsTrigger value="remediation">
                        Remediation Queue
                        {pendingApprovals && pendingApprovals.length > 0 && (
                            <span className="ml-2 bg-red-100 text-red-600 px-2 rounded-full text-xs font-bold">
                                {pendingApprovals.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">Execution History</TabsTrigger>
                </TabsList>

                <TabsContent value="jobs" className="space-y-6">
                    <div className="flex justify-end">
                        <JobScheduler onCreate={handleCreateJob} />
                    </div>
                    <JobsList
                        jobs={jobs || []}
                        isLoading={isLoadingJobs}
                        onRun={handleRunJob}
                        onEdit={() => { }} // TODO implement edit
                        onDelete={handleDeleteJob}
                    />
                </TabsContent>

                <TabsContent value="remediation" className="space-y-6">
                    <RemediationQueue
                        items={pendingApprovals || []}
                        isLoading={isLoadingApprovals}
                        onApprove={handleApprove}
                        onReject={(id) => toast({ title: "Rejected", description: `Remediation ${id} rejected.` })}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Execution history visualization coming soon.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
