import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useRealtime = (
  channel: string,
  table: string,
  filter: string,
  callback: (payload: any) => void
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Stable callback that uses the ref
  const stableCallback = useCallback((payload: any) => {
    callbackRef.current(payload);
  }, []);

  useEffect(() => {
    console.log('Setting up realtime subscription for:', channel, table, filter);
    
    channelRef.current = supabase
      .channel(channel)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter,
      }, stableCallback)
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription for:', channel);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [channel, table, filter, stableCallback]);

  return channelRef.current;
};