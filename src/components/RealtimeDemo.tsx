import { useState, useMemo } from 'react'
import { useBroadcast } from '../hooks/useBroadcast'
import { supabase } from '../lib/supabase'

interface ChatMessage {
  id: string
  text: string
  sender: string
  timestamp: string
}

/**
 * A demo component showcasing real-time broadcast messaging.
 * Messages are shared in real-time between all connected clients.
 */
export function RealtimeDemo() {
  const [inputMessage, setInputMessage] = useState('')
  const [username, setUsername] = useState('')

  const { messages, send, isConnected, error } = useBroadcast<ChatMessage>({
    channelName: 'demo-chat',
    eventName: 'chat-message',
  })

  const isConfigured = supabase !== null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !username.trim()) return

    await send({
      id: crypto.randomUUID(),
      text: inputMessage,
      sender: username,
      timestamp: new Date().toISOString(),
    })

    setInputMessage('')
  }

  const connectionStatus = useMemo(() => {
    if (!isConfigured) return 'not-configured'
    if (error) return 'error'
    if (isConnected) return 'connected'
    return 'connecting'
  }, [isConfigured, error, isConnected])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
            Lovable Real-Time Demo
          </h1>
          <p className="text-slate-400">
            Real-time connection powered by Supabase
          </p>
        </header>

        {/* Connection Status */}
        <div className="mb-6">
          <div className="flex items-center gap-2 justify-center">
            <span
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-sm text-slate-400">
              {connectionStatus === 'connected' && 'Connected to real-time channel'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'error' && 'Connection error'}
              {connectionStatus === 'not-configured' && 'Supabase not configured'}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-400 mb-2">Setup Required</h3>
            <p className="text-sm text-slate-300 mb-3">
              To enable real-time features, configure your Supabase connection:
            </p>
            <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
              <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">supabase.com</a></li>
              <li>Copy your project URL and anon key</li>
              <li>Create a <code className="bg-slate-700 px-1 rounded">.env</code> file with:
                <pre className="bg-slate-800 p-2 rounded mt-1 text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key`}
                </pre>
              </li>
              <li>Restart the development server</li>
            </ol>
          </div>
        )}

        {/* Username Input */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-1">Your Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Messages Area */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 mb-4 h-80 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-700/50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-purple-400">{msg.sender}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-200">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConfigured}
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isConfigured || !inputMessage.trim() || !username.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>

        {/* Feature List */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-center">Real-Time Features Available</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📡</div>
              <h3 className="font-semibold text-purple-400 mb-1">Broadcast</h3>
              <p className="text-sm text-slate-400">Real-time messaging between clients</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-semibold text-purple-400 mb-1">Database Changes</h3>
              <p className="text-sm text-slate-400">Subscribe to INSERT, UPDATE, DELETE</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold text-purple-400 mb-1">Presence</h3>
              <p className="text-sm text-slate-400">Track who's online in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
