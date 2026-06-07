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
  
  // Abort controller for active fetch stream connection
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (!user || isConnectingRef.current) return;

    // Clear any previous abort controllers or timers
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    isConnectingRef.current = true;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`${API_BASE}/api/ws/drifts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      });

      isConnectingRef.current = false;

      if (!response.ok) {
        throw new Error(`SSE stream HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported or empty response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Reset retry count on successful HTTP connection
      retryCountRef.current = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const dataStr = trimmed.slice(5).trim();
              const message: DriftStreamMessage = JSON.parse(dataStr);

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
                  // Could be used to update scan progress state
                  break;

                case 'connected':
                  console.log('Drift stream connected');
                  break;
              }
            } catch (err) {
              console.error('Failed to parse drift stream message:', err);
            }
          }
        }
      }
    } catch (error: any) {
      isConnectingRef.current = false;

      // Do not reconnect if the fetch request was aborted intentionally
      if (error.name === 'AbortError') {
        console.log('Drift stream connection aborted.');
        return;
      }

      console.error('Drift stream connection error:', error);

      // Implement exponential backoff retry loop up to 5 attempts
      const maxRetries = 5;
      if (retryCountRef.current < maxRetries) {
        const delay = Math.pow(2, retryCountRef.current) * 2000; // 2s, 4s, 8s, 16s, 32s
        retryCountRef.current += 1;
        console.log(`Reconnecting to drift stream in ${delay}ms (Attempt ${retryCountRef.current}/${maxRetries})...`);

        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error('Max drift stream reconnection attempts reached.');
      }
    }
  }, [user, queryClient, toast]);

  useEffect(() => {
    connect();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [connect]);
}