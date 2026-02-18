import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Recommendation, type PaginatedResponse } from '@/lib/api';

export function useRecommendations() {
  return useQuery<PaginatedResponse<Recommendation>>({
    queryKey: ['recommendations'],
    queryFn: () => api.recommendations.list(),
  });
}

export function useRecommendation(id: number) {
  return useQuery<Recommendation>({
    queryKey: ['recommendations', id],
    queryFn: () => api.recommendations.get(id),
    enabled: !!id,
  });
}

export function useRecommendationSavings() {
  return useQuery<{ totalSavings: number }>({
    queryKey: ['recommendations', 'savings'],
    queryFn: () => api.recommendations.getSavings(),
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.recommendations.generate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Recommendation> }) =>
      api.recommendations.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}
