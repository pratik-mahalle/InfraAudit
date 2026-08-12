import { useQuery } from '@tanstack/react-query';
import { api, type QueueJobStatus } from '@/lib/api';

const terminalQueueStates = new Set(['cancelled', 'completed', 'discarded']);

export function isTerminalQueueState(status: string | null | undefined) {
  return !!status && terminalQueueStates.has(status);
}

export function useQueueJobStatus(jobId: number | null | undefined) {
  return useQuery<QueueJobStatus>({
    queryKey: ['queue', 'jobs', jobId],
    queryFn: () => api.queue.getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return isTerminalQueueState(status) ? false : 3000;
    },
  });
}
