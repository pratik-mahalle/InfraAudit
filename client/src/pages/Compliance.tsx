import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    useComplianceOverview,
    useFrameworks,
    useRunAssessment,
    useAssessments,
    useToggleFramework,
    useFailingControls,
    useFrameworkControls
} from "@/hooks/use-compliance";
import { ComplianceScoreCard } from "@/components/compliance/ComplianceScoreCard";
import { FrameworkSelector } from "@/components/compliance/FrameworkSelector";
import { ControlsTable } from "@/components/compliance/ControlsTable";
import { AssessmentHistory } from "@/components/compliance/AssessmentHistory";
import { FailingControlsList } from "@/components/compliance/FailingControlsList";
import { PlayCircle, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Compliance() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");

    // Data fetching
    const { data: overview, isLoading: isLoadingOverview } = useComplianceOverview();
    const { data: frameworks, isLoading: isLoadingFrameworks } = useFrameworks();
    const { data: assessments, isLoading: isLoadingAssessments } = useAssessments(selectedFrameworkId);
    const { data: failingControls, isLoading: isLoadingFailures } = useFailingControls(selectedFrameworkId);
    const { data: controls, isLoading: isLoadingControls } = useFrameworkControls(selectedFrameworkId);

    const { mutate: runAssessment, isPending: isRunningAssessment } = useRunAssessment();
    const { mutate: toggleFramework } = useToggleFramework();

    // Set default selected framework
    useEffect(() => {
        if (frameworks && frameworks.length > 0 && !selectedFrameworkId) {
            // Prefer enabled frameworks
            const defaultFw = frameworks.find(f => f.isEnabled) || frameworks[0];
            setSelectedFrameworkId(defaultFw.id);
        }
    }, [frameworks, selectedFrameworkId]);

    const handleRunAssessment = () => {
        if (!selectedFrameworkId) {
            toast({ title: "No Framework Selected", description: "Please select a framework first.", variant: "destructive" });
            return;
        }

        runAssessment(selectedFrameworkId, {
            onSuccess: () => {
                toast({ title: "Assessment Started", description: "Compliance assessment is running in the background." });
            },
            onError: () => {
                toast({ title: "Assessment Failed", description: "Could not start assessment.", variant: "destructive" });
            }
        });
    };

    const selectedFramework = frameworks?.find(f => f.id === selectedFrameworkId);

    return (
        <DashboardLayout>
            <PageHeader
                title="Compliance & Governance"
                description="Manage compliance frameworks, run assessments, and track controls."
                actions={
                    <div className="flex space-x-2">
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={handleRunAssessment}
                            disabled={isRunningAssessment || !selectedFrameworkId}
                        >
                            <PlayCircle className={`h-4 w-4 ${isRunningAssessment ? "animate-spin" : ""}`} />
                            {isRunningAssessment ? "Running..." : "Run Assessment"}
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                }
            />

            {/* Global State Stats (if needed) or just tabs */}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Dashboard</TabsTrigger>
                    <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
                    <TabsTrigger value="controls">Controls</TabsTrigger>
                    <TabsTrigger value="reports">Reports & History</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score Card */}
                        <div className="md:col-span-2">
                            <ComplianceScoreCard
                                score={overview?.compliancePercent || 0}
                                passing={overview?.passedControls || 0}
                                failing={overview?.failedControls || 0}
                            />
                        </div>

                        {/* Top Failing Controls - Contextual to Global or Selected? Global for Dashboard */}
                        <div>
                            {/* To show FailingControlsList we need data. We use the 'selected' framework for now or need a global endpoint */}
                            <Card className="h-full">
                                <CardHeader><CardTitle>Framework Status</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {frameworks?.map(fw => (
                                            <div key={fw.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedFrameworkId(fw.id)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${fw.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    <span className="font-medium">{fw.name}</span>
                                                </div>
                                                {fw.id === selectedFrameworkId && <Badge>Selected</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {selectedFrameworkId && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Critical Issues: {selectedFramework?.name}
                            </h3>
                            <FailingControlsList
                                findings={failingControls || []}
                                isLoading={isLoadingFailures}
                            />
                        </div>
                    )}
                </TabsContent>

                {/* Frameworks Tab */}
                <TabsContent value="frameworks">
                    <FrameworkSelector
                        frameworks={frameworks || []}
                        selectedId={selectedFrameworkId}
                        onSelect={setSelectedFrameworkId}
                        onToggle={(id, enabled) => toggleFramework({ id, enabled })}
                    />
                </TabsContent>

                {/* Controls Tab */}
                <TabsContent value="controls">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Viewing Framework:</span>
                            <Select value={selectedFrameworkId} onValueChange={setSelectedFrameworkId}>
                                <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="Select Framework" />
                                </SelectTrigger>
                                <SelectContent>
                                    {frameworks?.map(fw => (
                                        <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {controls?.length || 0} Controls Total
                        </div>
                    </div>
                    <ControlsTable
                        controls={controls || []}
                        isLoading={isLoadingControls}
                    />
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold">Assessment History</h3>
                        <p className="text-sm text-muted-foreground">View past compliance assessment runs and their results.</p>
                    </div>
                    <AssessmentHistory
                        assessments={assessments || []}
                        isLoading={isLoadingAssessments}
                    />
                </TabsContent>

            </Tabs>

        </DashboardLayout>
    );
}
