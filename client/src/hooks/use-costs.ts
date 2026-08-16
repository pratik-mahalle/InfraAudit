import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CostExplorerFilters, CostMonitorInput, CostOptimizationFilters } from '@/types';

export function useCostOverview() {
    return useQuery({
        queryKey: ['/api/v1/costs'],
        queryFn: () => api.costs.getOverview(),
    });
}

export function useCostAccounts() {
    return useQuery({
        queryKey: ['/api/v1/costs/accounts'],
        queryFn: () => api.costs.listAccounts(),
    });
}

export function useCostExplorer(filters: CostExplorerFilters) {
    return useQuery({
        queryKey: ['/api/v1/costs/explorer', filters],
        queryFn: () => api.costs.getExplorer(filters),
    });
}

export function useCostMonitors(limit = 25, offset = 0) {
    return useQuery({
        queryKey: ['/api/v1/costs/monitors', limit, offset],
        queryFn: () => api.costs.listMonitors(limit, offset),
    });
}

export function useCostMonitorEvaluations(id?: string, limit = 25, offset = 0) {
    return useQuery({
        queryKey: ['/api/v1/costs/monitors/evaluations', id, limit, offset],
        queryFn: () => api.costs.listMonitorEvaluations(id!, limit, offset),
        enabled: !!id,
    });
}

export function useCreateCostMonitor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CostMonitorInput) => api.costs.createMonitor(input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/monitors'] }),
    });
}

export function useUpdateCostMonitor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: CostMonitorInput }) => api.costs.updateMonitor(id, input),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/monitors'] }),
    });
}

export function useDeleteCostMonitor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.costs.deleteMonitor(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/monitors'] }),
    });
}

export function useEvaluateCostMonitor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.costs.evaluateMonitor(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/monitors'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/monitors/evaluations', id] });
        },
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

export function useCostForecast(provider = '', days = 30, model = 'linear') {
    return useQuery({
        queryKey: ['/api/v1/costs/forecast', provider, days, model],
        queryFn: () => api.costs.getForecast(provider, days, model),
    });
}

export function useCostAnomalies(status = 'open', limit = 10, offset = 0) {
    return useQuery({
        queryKey: ['/api/v1/costs/anomalies', status, limit, offset],
        queryFn: () => api.costs.listAnomalies(status, limit, offset),
    });
}

export function useCostOptimizations(filters: CostOptimizationFilters = {}) {
    return useQuery({
        queryKey: ['/api/v1/costs/optimizations', filters],
        queryFn: () => api.costs.listOptimizations(filters),
    });
}

export function useCostOptimizationAnalysisStatus(provider = 'aws') {
    return useQuery({
        queryKey: ['/api/v1/costs/optimizations/analysis-status', provider],
        queryFn: () => api.costs.getOptimizationAnalysisStatus(provider),
    });
}

export function useUpdateCostAnomaly() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, notes }: { id: string | number; status: 'open' | 'reviewed' | 'resolved'; notes?: string }) =>
            api.costs.updateAnomaly(id, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/anomalies'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
        },
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
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
        },
    });
}

export function useGenerateCostOptimizations() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (provider?: string) => api.costs.generateOptimizations(provider),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/optimizations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/optimizations/analysis-status'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
        },
    });
}

export function useUpdateCostOptimization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, notes }: {
            id: string;
            status: 'acknowledged' | 'planned' | 'applied' | 'verified' | 'dismissed';
            notes?: string;
        }) => api.costs.updateOptimization(id, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/optimizations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/roi'] });
        },
    });
}

export function useAIForecast() {
    return useMutation({
        mutationFn: () => api.costs.getAIForecast(),
    });
}

export function useROIData() {
    return useQuery({
        queryKey: ['/api/v1/costs/roi'],
        queryFn: () => api.costs.getROI(),
    });
}
