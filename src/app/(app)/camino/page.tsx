import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSubjects } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'

/** "Camino" de la barra: la última materia abierta (cookie que pone NavPill) o la primera. */
async function Go() {
  await requireUser()
  const [subjects, jar] = await Promise.all([getSubjects(), cookies()])
  const last = jar.get('ovo_materia')?.value
  const target = subjects.find((s) => s.id === last) ?? subjects[0]
  if (!target) return <main className="soon"><h1>ovo</h1><p>Aún no hay materias.</p></main>
  redirect(`/materia/${target.id}`)
}

export default function Page() {
  return <Suspense fallback={null}><Go /></Suspense>
}
