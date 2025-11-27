import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseBroadcastOptions<T> {
  channelName: string
  eventName: string
  onMessage?: (payload: T) => void
}

/**
 * Custom hook for real-time broadcast messaging.
 * Allows sending and receiving messages to all connected clients.
 * 
 * @example
 * ```tsx
 * const { messages, send, isConnected } = useBroadcast<ChatMessage>({
 *   channelName: 'chat-room',
 *   eventName: 'message',
 *   onMessage: (msg) => console.log('Received:', msg),
 * })
 * 
 * // Send a message
 * send({ text: 'Hello world!', sender: 'user-123' })
 * ```
 */
export function useBroadcast<T>({
  channelName,
  eventName,
  onMessage,
}: UseBroadcastOptions<T>) {
  const [messages, setMessages] = useState<T[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Handle missing supabase client without using effect
  const initializationError = useMemo(() => {
    if (!supabase) {
      return new Error('Supabase client not initialized')
    }
    return null
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    const supabaseClient = supabase

    const newChannel = supabaseClient
      .channel(channelName)
      .on('broadcast', { event: eventName }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as T])
        onMessage?.(payload as T)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setSubscriptionError(null)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setSubscriptionError(new Error('Failed to subscribe to broadcast channel'))
        }
      })

    channelRef.current = newChannel

    return () => {
      if (newChannel) {
        supabaseClient.removeChannel(newChannel)
      }
    }
  }, [channelName, eventName, onMessage])

  const send = useCallback(
    async (payload: T) => {
      if (!channelRef.current || !isConnected) {
        console.warn('Cannot send message: channel not connected')
        return
      }

      await channelRef.current.send({
        type: 'broadcast',
        event: eventName,
        payload,
      })
    },
    [eventName, isConnected]
  )

  const error = initializationError ?? subscriptionError

  return { messages, send, isConnected, error, clearMessages: () => setMessages([]) }
}
