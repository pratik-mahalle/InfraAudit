import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CostOverview, CostTrend, CostAnomaly, CostForecast, CostOptimization, CostSummary } from '@/types';

export function useCostOverview() {
    return useQuery({
        queryKey: ['/api/v1/costs'],
        queryFn: () => api.costs.getOverview(),
    });
}

export function useCostByProvider(provider: string, period = 'monthly') {
    return useQuery({
        queryKey: ['/api/v1/costs', provider, period],
        queryFn: () => api.costs.getByProvider(provider, period),
        enabled: !!provider,
    });
}

export function useCostTrends(provider = '', period = 'monthly') {
    return useQuery({
        queryKey: ['/api/v1/costs/trends', provider, period],
        queryFn: () => api.costs.getTrends(provider, period),
    });
}

export function useCostForecast(provider = '', days = 30) {
    return useQuery({
        queryKey: ['/api/v1/costs/forecast', provider, days],
        queryFn: () => api.costs.getForecast(provider, days),
    });
}

export function useCostAnomalies(status = 'open', limit = 10, offset = 0) {
    return useQuery({
        queryKey: ['/api/v1/costs/anomalies', status, limit, offset],
        queryFn: () => api.costs.listAnomalies(status, limit, offset),
    });
}

export function useCostOptimizations(status = 'open', limit = 10, offset = 0) {
    return useQuery({
        queryKey: ['/api/v1/costs/optimizations', status, limit, offset],
        queryFn: () => api.costs.listOptimizations(status, limit, offset),
    });
}

export function usePotentialSavings() {
    return useQuery({
        queryKey: ['/api/v1/costs/savings'],
        queryFn: () => api.costs.getSavings(),
    });
}

export function useSyncCosts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (provider?: string) => api.costs.sync(provider),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
        },
    });
}

export function useDetectAnomalies() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (provider?: string) => api.costs.detectAnomalies(provider),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/anomalies'] });
        },
    });
}
