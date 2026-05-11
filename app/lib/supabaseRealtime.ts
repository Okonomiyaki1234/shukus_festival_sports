import { supabase } from "./supabaseClient";

// Realtimeチャンネル購読のサンプル関数
export function subscribeToRealtime(channel: string, onPayload: (payload: any) => void) {
  const realtimeChannel = supabase.channel(channel);
  realtimeChannel.on('broadcast', { event: 'change' }, payload => {
    onPayload(payload);
  });
  realtimeChannel.subscribe();
  return () => {
    realtimeChannel.unsubscribe();
  };
}
