import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface DriftStreamMessage {
  type: 'connected' | 'drift_detected' | 'drift_resolved' | 'scan_progress';
  data: any;
  timestamp: string;
  userId?: number;
}

export function useDriftStream() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    const url = `${API_BASE}/api/ws/drifts`;
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message: DriftStreamMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'drift_detected':
            queryClient.invalidateQueries({ queryKey: ['drifts'] });
            queryClient.invalidateQueries({ queryKey: ['iac', 'drifts'] });
            toast({
              title: 'New Drift Detected',
              description: 'A configuration drift has been detected in your infrastructure.',
              variant: 'destructive',
            });
            break;

          case 'drift_resolved':
            queryClient.invalidateQueries({ queryKey: ['drifts'] });
            queryClient.invalidateQueries({ queryKey: ['iac', 'drifts'] });
            toast({
              title: 'Drift Resolved',
              description: 'A configuration drift has been resolved.',
            });
            break;

          case 'scan_progress':
            // Could be used to update a progress indicator
            break;

          case 'connected':
            break;
        }
      } catch {
        // Ignore parse errors for malformed messages
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;

      // Reconnect after 5 seconds
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [user, queryClient, toast]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [connect]);
}
