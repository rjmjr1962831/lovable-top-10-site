import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload 
} from '@supabase/supabase-js'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions<T extends { [key: string]: unknown }> {
  table: string
  schema?: string
  event?: RealtimeEvent
  filter?: string
  /** Primary key field name used for efficient object comparison. Defaults to 'id'. */
  primaryKey?: keyof T
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
}

/**
 * Compares two objects for equality.
 * Uses primary key comparison if available, otherwise falls back to JSON comparison.
 */
function areEqual<T extends { [key: string]: unknown }>(
  a: T, 
  b: Partial<T>, 
  primaryKey?: keyof T
): boolean {
  if (primaryKey && primaryKey in a && primaryKey in b) {
    return a[primaryKey] === b[primaryKey]
  }
  // Fallback: check for common id fields
  if ('id' in a && 'id' in b) {
    return a.id === b.id
  }
  if ('uuid' in a && 'uuid' in b) {
    return a.uuid === b.uuid
  }
  // Last resort: JSON comparison
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Custom hook for subscribing to real-time database changes via Supabase.
 * 
 * @example
 * ```tsx
 * const { data, isConnected, error } = useRealtime<Message>({
 *   table: 'messages',
 *   event: '*',
 *   primaryKey: 'id',
 *   onInsert: (newMessage) => console.log('New message:', newMessage),
 * })
 * ```
 */
export function useRealtime<T extends { [key: string]: unknown }>({
  table,
  schema = 'public',
  event = '*',
  filter,
  primaryKey,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null)

  // Handle missing supabase client without using effect
  const initializationError = useMemo(() => {
    if (!supabase) {
      return new Error('Supabase client not initialized')
    }
    return null
  }, [])

  const handleAllChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      const eventType = payload.eventType

      if (eventType === 'INSERT' && payload.new) {
        setData((prev) => [...prev, payload.new as T])
        onInsert?.(payload.new as T)
      } else if (eventType === 'UPDATE' && payload.new && payload.old) {
        setData((prev) =>
          prev.map((item) =>
            areEqual(item, payload.old, primaryKey)
              ? (payload.new as T)
              : item
          )
        )
        onUpdate?.({ old: payload.old as T, new: payload.new as T })
      } else if (eventType === 'DELETE' && payload.old) {
        setData((prev) =>
          prev.filter(
            (item) => !areEqual(item, payload.old, primaryKey)
          )
        )
        onDelete?.(payload.old as T)
      }
    },
    [onInsert, onUpdate, onDelete, primaryKey]
  )

  const handleInsert = useCallback(
    (payload: RealtimePostgresInsertPayload<T>) => {
      if (payload.new) {
        setData((prev) => [...prev, payload.new as T])
        onInsert?.(payload.new as T)
      }
    },
    [onInsert]
  )

  const handleUpdate = useCallback(
    (payload: RealtimePostgresUpdatePayload<T>) => {
      if (payload.new && payload.old) {
        setData((prev) =>
          prev.map((item) =>
            areEqual(item, payload.old, primaryKey)
              ? (payload.new as T)
              : item
          )
        )
        onUpdate?.({ old: payload.old as T, new: payload.new as T })
      }
    },
    [onUpdate, primaryKey]
  )

  const handleDelete = useCallback(
    (payload: RealtimePostgresDeletePayload<T>) => {
      if (payload.old) {
        setData((prev) =>
          prev.filter(
            (item) => !areEqual(item, payload.old, primaryKey)
          )
        )
        onDelete?.(payload.old as T)
      }
    },
    [onDelete, primaryKey]
  )

  useEffect(() => {
    if (!supabase) {
      return
    }

    let channel: RealtimeChannel

    const channelName = `${schema}:${table}${filter ? `:${filter}` : ''}`
    const supabaseClient = supabase

    const baseChannel = supabaseClient.channel(channelName)
    
    // Subscribe based on event type
    if (event === '*') {
      channel = baseChannel
        .on<T>(
          'postgres_changes',
          { event: '*', schema, table, filter },
          handleAllChanges
        )
        .subscribe(handleStatus)
    } else if (event === 'INSERT') {
      channel = baseChannel
        .on<T>(
          'postgres_changes',
          { event: 'INSERT', schema, table, filter },
          handleInsert
        )
        .subscribe(handleStatus)
    } else if (event === 'UPDATE') {
      channel = baseChannel
        .on<T>(
          'postgres_changes',
          { event: 'UPDATE', schema, table, filter },
          handleUpdate
        )
        .subscribe(handleStatus)
    } else {
      channel = baseChannel
        .on<T>(
          'postgres_changes',
          { event: 'DELETE', schema, table, filter },
          handleDelete
        )
        .subscribe(handleStatus)
    }

    function handleStatus(status: string) {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setSubscriptionError(null)
      } else if (status === 'CLOSED') {
        setIsConnected(false)
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false)
        setSubscriptionError(new Error('Failed to subscribe to channel'))
      }
    }

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [table, schema, event, filter, handleAllChanges, handleInsert, handleUpdate, handleDelete])

  const error = initializationError ?? subscriptionError

  return { data, setData, isConnected, error }
}
