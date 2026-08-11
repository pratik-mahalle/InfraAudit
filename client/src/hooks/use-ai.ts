import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { AIProviderName, AIRunStatus } from '@/lib/api';

export const aiProviderQueryKey = ['ai', 'providers'] as const;
export const aiConfigQueryKey = ['ai', 'config'] as const;

export function useAIProviders() {
  return useQuery({
    queryKey: aiProviderQueryKey,
    queryFn: () => api.ai.listProviders(),
    staleTime: 60_000,
  });
}

export function useAIConfig() {
  return useQuery({
    queryKey: aiConfigQueryKey,
    queryFn: () => api.ai.getConfig(),
  });
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providers: Array<{
      provider: AIProviderName;
      is_default: boolean;
      fallback_order: number;
    }>) => api.ai.updateOrgConfig(providers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiConfigQueryKey });
    },
  });
}

export function useAIRuns(params: { status?: AIRunStatus; taskKind?: string; limit: number; offset: number }) {
  return useQuery({
    queryKey: ['ai', 'runs', params],
    queryFn: () => api.ai.listRuns(params),
  });
}
