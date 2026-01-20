import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface JobSchedulerProps {
    onCreate: (job: any) => void;
}

export function JobScheduler({ onCreate }: JobSchedulerProps) {
    const [open, setOpen] = useState(false);
    const [job, setJob] = useState({
        name: '',
        type: 'compliance_scan', // default
        schedule: '0 0 * * *', // daily midnight
        description: '',
        config: {}
    });

    const handleSubmit = () => {
        onCreate(job);
        setOpen(false);
        setJob({ ...job, name: '', description: '' });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Schedule New Job
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule New Automation Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Job Name</Label>
                        <Input
                            placeholder="Daily Compliance Scan"
                            value={job.name}
                            onChange={e => setJob({ ...job, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Job Type</Label>
                        <Select value={job.type} onValueChange={v => setJob({ ...job, type: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="compliance_scan">Compliance Scan</SelectItem>
                                <SelectItem value="cost_report">Cost Report Generation</SelectItem>
                                <SelectItem value="drift_detection">Drift Detection</SelectItem>
                                <SelectItem value="resource_cleanup">Resource Cleanup</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Schedule (Cron Expression)</Label>
                        <Input
                            placeholder="0 0 * * *"
                            value={job.schedule}
                            onChange={e => setJob({ ...job, schedule: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">e.g. "0 0 * * *" for daily at midnight UTC</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            placeholder="Runs full compliance check..."
                            value={job.description}
                            onChange={e => setJob({ ...job, description: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Create Job</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
