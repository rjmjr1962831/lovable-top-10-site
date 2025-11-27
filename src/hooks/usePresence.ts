import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceState {
  [key: string]: {
    user_id: string
    online_at: string
    [key: string]: unknown
  }[]
}

interface UsePresenceOptions {
  channelName: string
  userId: string
  userMetadata?: Record<string, unknown>
}

/**
 * Custom hook for managing real-time presence (e.g., who's online).
 * 
 * @example
 * ```tsx
 * const { onlineUsers, isConnected, error } = usePresence({
 *   channelName: 'lobby',
 *   userId: 'user-123',
 *   userMetadata: { name: 'John' },
 * })
 * ```
 */
export function usePresence({
  channelName,
  userId,
  userMetadata = {},
}: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState>({})
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null)

  // Handle missing supabase client without using effect
  const initializationError = useMemo(() => {
    if (!supabase) {
      return new Error('Supabase client not initialized')
    }
    return null
  }, [])

  const handleSync = useCallback(() => {
    if (!supabase) return
    
    const channel = supabase.channel(channelName)
    const state = channel.presenceState<{
      user_id: string
      online_at: string
    }>()
    setOnlineUsers(state)
  }, [channelName])

  useEffect(() => {
    if (!supabase) {
      return
    }

    const supabaseClient = supabase

    const channel: RealtimeChannel = supabaseClient
      .channel(channelName)
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...userMetadata,
          })
          setIsConnected(true)
          setSubscriptionError(null)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setSubscriptionError(new Error('Failed to subscribe to presence channel'))
        }
      })

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [channelName, userId, userMetadata, handleSync])

  const error = initializationError ?? subscriptionError

  return { onlineUsers, isConnected, error }
}
