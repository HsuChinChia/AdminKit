import { onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

interface RealtimeCallbacks<T = Record<string, any>> {
  onInsert?: (row: T) => void
  onUpdate?: (newRow: T, oldRow: T) => void
  onDelete?: (oldRow: T) => void
}

/**
 * Supabase Realtime 訂閱組合式函數（TypeScript）
 *
 * 使用方式：
 *   useRealtime<Order>('orders', { onInsert: (row) => notify.success('新訂單！') })
 */
export function useRealtime<T = Record<string, any>>(
  tableName: string,
  callbacks: RealtimeCallbacks<T>,
  filter?: string
) {
  const config: Record<string, any> = {
    event:  '*',
    schema: 'public',
    table:  tableName,
  }
  if (filter) config.filter = filter

  const channel = supabase
    .channel(`realtime:${tableName}:${Date.now()}`)
    // @ts-ignore
    .on('postgres_changes', config, (payload) => {
      const { eventType, new: newRow, old: oldRow } = payload
      if (eventType === 'INSERT' && callbacks.onInsert) callbacks.onInsert(newRow as T)
      if (eventType === 'UPDATE' && callbacks.onUpdate) callbacks.onUpdate(newRow as T, oldRow as T)
      if (eventType === 'DELETE' && callbacks.onDelete) callbacks.onDelete(oldRow as T)
    })
    .subscribe()

  onUnmounted(() => supabase.removeChannel(channel))

  return { channel }
}
