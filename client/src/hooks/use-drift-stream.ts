import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { supabase } from '@/lib/supabase';

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

  // BUG-017 fix: Track retry attempts for exponential backoff with max limit
  const MAX_RETRIES = 5;
  const retryCountRef = useRef(0);

  const connect = useCallback(async () => {
    if (!user || eventSourceRef.current) return;

    // EventSource can't set Authorization header, so pass token as query param
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const url = `${API_BASE}/api/ws/drifts${token ? `?token=${token}` : ''}`;
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
            // Reset retry counter on successful connection
            retryCountRef.current = 0;
            break;
        }
      } catch {
        // Ignore parse errors for malformed messages
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;

      // Exponential backoff: 2s, 4s, 8s, 16s, 32s — then stop
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 32000);
        retryCountRef.current++;
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
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
