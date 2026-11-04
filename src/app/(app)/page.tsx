import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSubjects } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'

async function Go() {
  await requireUser()
  const [first] = await getSubjects()
  if (!first) return <main className="soon"><h1>Ovo</h1><p>Aún no hay materias.</p></main>
  redirect(`/materia/${first.id}`)
}

export default function Page() {
  return <Suspense fallback={null}><Go /></Suspense>
}
