'use server'

import { redirect } from 'next/navigation'
import { isOwner } from '@/lib/owner'
import { createServerSupabase } from '@/lib/supabase/server'

export async function signIn(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })
  if (error) return { error: 'Correo o contraseña incorrectos.' }
  if (!isOwner(data.user?.email)) {
    await supabase.auth.signOut()
    return { error: 'Correo o contraseña incorrectos.' }
  }
  redirect('/')
}
