import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Component: el proxy ya refresca la sesión.
          }
        },
      },
    },
  )
}

/** Valida la sesión (getClaims) o manda a /login. La conexión a la BD se salta RLS, así que toda página/acción que lea datos debe llamarla. */
export async function requireUser() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')
  return data.claims
}
