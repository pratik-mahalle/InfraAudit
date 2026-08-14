import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Vulnerability, type VulnerabilityScan, type VulnerabilityScanDetail, type PaginatedResponse } from '@/lib/api';

export function useVulnerabilities() {
  return useQuery<PaginatedResponse<Vulnerability>>({
    queryKey: ['vulnerabilities'],
    queryFn: () => api.vulnerabilities.list(),
  });
}

export function useVulnerabilityScans(enabled = true) {
  return useQuery<PaginatedResponse<VulnerabilityScan>>({
    queryKey: ['vulnerability-scans'],
    queryFn: () => api.vulnerabilities.listScans(),
    enabled,
  });
}

export function useVulnerabilityScan(id: number | null) {
  return useQuery<VulnerabilityScanDetail>({
    queryKey: ['vulnerability-scans', id],
    queryFn: () => api.vulnerabilities.getScan(id as number),
    enabled: !!id,
  });
}

export function useVulnerability(id: number) {
  return useQuery<Vulnerability>({
    queryKey: ['vulnerabilities', id],
    queryFn: () => api.vulnerabilities.get(id),
    enabled: !!id,
  });
}

export function useVulnerabilitySummary() {
  return useQuery<Record<string, number>>({
    queryKey: ['vulnerabilities', 'summary'],
    queryFn: () => api.vulnerabilities.getSummary(),
  });
}

export function useTopVulnerabilities() {
  return useQuery<Vulnerability[]>({
    queryKey: ['vulnerabilities', 'top'],
    queryFn: () => api.vulnerabilities.getTop(),
  });
}

export function useTriggerVulnerabilityScan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.vulnerabilities.scan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] });
      queryClient.invalidateQueries({ queryKey: ['vulnerability-scans'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
