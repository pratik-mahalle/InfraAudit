import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { NotificationPreference } from '@/types';

export function useNotificationPreferences() {
    return useQuery({
        queryKey: ['/api/v1/notifications/preferences'],
        queryFn: () => api.notifications.getPreferences(),
    });
}

export function useUpdatePreference() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ channel, settings }: { channel: string; settings: any }) =>
            api.notifications.updatePreference(channel, settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/notifications/preferences'] });
        },
    });
}

export function useSendTestNotification() {
    return useMutation({
        mutationFn: ({ channel, message }: { channel: string; message: string }) =>
            api.notifications.send(channel, message),
    });
}

export function useWebhooks() {
    return useQuery({
        queryKey: ['/api/v1/webhooks'],
        queryFn: () => api.webhooks.list(),
    });
}

export function useCreateWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (webhook: any) => api.webhooks.create(webhook),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/webhooks'] });
        },
    });
}

export function useDeleteWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.webhooks.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/v1/webhooks'] });
        },
    });
}
