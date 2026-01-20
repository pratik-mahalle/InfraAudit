import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ScheduledJob, JobExecution } from '@/types';

// Jobs Hooks
export function useJobs() {
    return useQuery({
        queryKey: ['/api/v1/jobs'],
        queryFn: () => api.jobs.list(),
    });
}

export function useCreateJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (job: Partial<ScheduledJob>) => api.jobs.create(job),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/jobs'] });
        },
    });
}

export function useUpdateJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, job }: { id: string; job: Partial<ScheduledJob> }) => api.jobs.update(id, job),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/jobs'] });
        },
    });
}

export function useDeleteJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.jobs.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/jobs'] });
        },
    });
}

export function useTriggerJob() {
    return useMutation({
        mutationFn: (id: string) => api.jobs.trigger(id),
    });
}

export function useJobExecutions(jobId: string) {
    return useQuery({
        queryKey: [`/api/v1/jobs/${jobId}/executions`],
        queryFn: () => api.jobs.getExecutions(jobId),
        enabled: !!jobId,
    });
}

// Remediation Hooks
export function useRemediationSummary() {
    return useQuery({
        queryKey: ['/api/v1/remediation/summary'],
        queryFn: () => api.remediation.getSummary(),
    });
}

export function usePendingApprovals() {
    return useQuery({
        queryKey: ['/api/v1/remediation/pending'],
        queryFn: () => api.remediation.getPendingApprovals(),
    });
}

export function useExecuteRemediation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.remediation.executeAction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/remediation'] });
        },
    });
}

export function useApproveRemediation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.remediation.approveAction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/remediation'] });
        },
    });
}
