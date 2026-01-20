import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { ScheduledJob } from '@/types';
import { Play, Clock, MoreHorizontal, Calendar } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobsListProps {
    jobs: ScheduledJob[];
    isLoading: boolean;
    onRun: (id: string) => void;
    onEdit: (job: ScheduledJob) => void;
    onDelete: (id: string) => void;
}

export function JobsList({ jobs, isLoading, onRun, onEdit, onDelete }: JobsListProps) {
    if (isLoading) return <div>Loading jobs...</div>;

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Last Run</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs && jobs.length > 0 ? (
                            jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{job.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{job.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{job.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Calendar className="w-3 h-3" /> {job.schedule}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        !job.enabled ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }`}
                                            variant="outline"
                                        >
                                            {job.status === 'running' ? 'Running' :
                                                job.status === 'failed' ? 'Failed' :
                                                    !job.enabled ? 'Paused' : 'Active'}
                                        </Badge>                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => onRun(job.id)} title="Run Now">
                                                <Play className="w-4 h-4 text-primary" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onEdit(job)}>Edit Configuration</DropdownMenuItem>
                                                    <DropdownMenuItem>View Executions</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(job.id)}>Delete Job</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6">No scheduled jobs found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
