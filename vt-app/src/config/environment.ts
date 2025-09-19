export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  livekit: {
    apiUrl: process.env.LIVEKIT_API_URL || 'https://api.livekit.io',
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    websocketUrl: process.env.LIVEKIT_WEBSOCKET_URL,
    publicWebsocketUrl: process.env.NEXT_PUBLIC_LIVEKIT_WEBSOCKET_URL,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },
}