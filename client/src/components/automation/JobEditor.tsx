import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScheduledJob } from '@/types';

interface JobEditorProps {
    job: ScheduledJob | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (id: string, job: Partial<ScheduledJob>) => void;
}

export function JobEditor({ job, open, onOpenChange, onSave }: JobEditorProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('compliance_scan');
    const [schedule, setSchedule] = useState('0 0 * * *');
    const [description, setDescription] = useState('');
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (job) {
            setName(job.name || '');
            setType(job.type || 'compliance_scan');
            setSchedule(job.schedule || '0 0 * * *');
            setDescription(job.description || '');
            setEnabled(job.enabled !== false);
        }
    }, [job]);

    const handleSubmit = () => {
        if (!job) return;
        onSave(job.id, {
            name,
            type,
            schedule,
            description,
            enabled
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Automation Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Job Name</Label>
                        <Input
                            placeholder="Daily Compliance Scan"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Job Type</Label>
                        <Select value={type} onValueChange={setType}>
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
                            value={schedule}
                            onChange={e => setSchedule(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">e.g. "0 0 * * *" for daily at midnight UTC</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            placeholder="Runs full compliance check..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-0.5">
                            <Label>Active Status</Label>
                            <p className="text-xs text-muted-foreground">Whether this job is enabled or paused</p>
                        </div>
                        <Switch
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
