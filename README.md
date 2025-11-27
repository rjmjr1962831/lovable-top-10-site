# Lovable Top 10 Site

A real-time enabled Lovable site built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Real-Time Database Subscriptions**: Subscribe to INSERT, UPDATE, and DELETE events on your database tables
- **Real-Time Broadcast**: Send and receive messages between connected clients instantly
- **Presence Tracking**: Track who's online in real-time

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A [Supabase](https://supabase.com) account (free tier works)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lovable-top-10-site
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Real-Time Hooks

This project includes three custom hooks for real-time functionality:

### `useRealtime<T>` - Database Changes

Subscribe to real-time database changes:

```tsx
import { useRealtime } from './hooks'

const { data, isConnected, error } = useRealtime<Message>({
  table: 'messages',
  event: '*', // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  primaryKey: 'id', // Optional: specify primary key for efficient comparisons
  onInsert: (newMessage) => console.log('New message:', newMessage),
  onUpdate: ({ old, new: updated }) => console.log('Updated:', updated),
  onDelete: (deleted) => console.log('Deleted:', deleted),
})
```

### `useBroadcast<T>` - Real-Time Messaging

Send and receive broadcast messages:

```tsx
import { useBroadcast } from './hooks'

const { messages, send, isConnected } = useBroadcast<ChatMessage>({
  channelName: 'chat-room',
  eventName: 'message',
  onMessage: (msg) => console.log('Received:', msg),
})

// Send a message
await send({ text: 'Hello!', sender: 'user-123' })
```

### `usePresence` - Online Users

Track who's online in real-time:

```tsx
import { usePresence } from './hooks'

const { onlineUsers, isConnected } = usePresence({
  channelName: 'lobby',
  userId: 'user-123',
  userMetadata: { name: 'John', avatar: 'url...' },
})
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- [React](https://react.dev) - UI library
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Vite](https://vite.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Supabase](https://supabase.com) - Backend and real-time infrastructure

## License

MIT
