// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Only set cookies in server actions or route handlers
          // For server components, we'll just ignore cookie setting
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Silently ignore cookie setting errors in read-only contexts
            // This prevents the app from breaking when Supabase tries to refresh tokens
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Silently ignore cookie removal errors in read-only contexts
          }
        },
      },
    }
  )
}
