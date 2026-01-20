import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    ComplianceOverview,
    ComplianceFramework,
    ComplianceTrend,
    ComplianceAssessment,
    ComplianceControl,
    AssessmentFinding
} from '@/types';

export function useComplianceOverview() {
    return useQuery({
        queryKey: ['/api/v1/compliance/overview'],
        queryFn: () => api.compliance.getOverview(),
    });
}

export function useComplianceTrend(frameworkId: string, days = 30) {
    return useQuery({
        queryKey: ['/api/v1/compliance/trend', frameworkId, days],
        queryFn: () => api.compliance.getTrend(frameworkId, days),
        enabled: !!frameworkId,
    });
}

export function useFrameworks() {
    return useQuery({
        queryKey: ['/api/v1/compliance/frameworks'],
        queryFn: () => api.compliance.listFrameworks(),
    });
}

export function useFramework(id: string) {
    return useQuery({
        queryKey: ['/api/v1/compliance/frameworks', id],
        queryFn: () => api.compliance.getFramework(id),
        enabled: !!id,
    });
}

export function useFrameworkControls(frameworkId: string, category = '') {
    return useQuery({
        queryKey: ['/api/v1/compliance/frameworks/controls', frameworkId, category],
        queryFn: () => api.compliance.listControls(frameworkId, category),
        enabled: !!frameworkId,
    });
}

export function useAssessments(frameworkId = '', limit = 10, offset = 0) {
    return useQuery({
        queryKey: ['/api/v1/compliance/assessments', frameworkId, limit, offset],
        queryFn: () => api.compliance.listAssessments(frameworkId, limit, offset),
    });
}

export function useAssessment(id: string) {
    return useQuery({
        queryKey: ['/api/v1/compliance/assessments', id],
        queryFn: () => api.compliance.getAssessment(id),
        enabled: !!id,
    });
}

export function useFailingControls(frameworkId: string) {
    return useQuery({
        queryKey: ['/api/v1/compliance/controls/failing', frameworkId],
        queryFn: () => api.compliance.getFailingControls(frameworkId),
        enabled: !!frameworkId,
    });
}

export function useRunAssessment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (frameworkId: string) => api.compliance.runAssessment(frameworkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/compliance'] });
        },
    });
}

export function useToggleFramework() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            enabled ? api.compliance.enableFramework(id) : api.compliance.disableFramework(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/compliance/frameworks'] });
            queryClient.invalidateQueries({ queryKey: ['/api/v1/compliance/overview'] });
        },
    });
}
