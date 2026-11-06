import { Suspense } from 'react'
import Link from 'next/link'
import { requireUser } from '@/lib/supabase/server'
import { signOut } from './actions'
import './ajustes.css'

async function Ajustes() {
  const claims = await requireUser()
  return (
    <main className="ajustes">
      <h1>Ajustes</h1>
      <section className="aj-card in" aria-labelledby="aj-cuenta">
        <h2 id="aj-cuenta">Cuenta</h2>
        <p className="aj-mail">{String(claims.email ?? '')}</p>
        <form action={signOut}>
          <button type="submit" className="aj-out">Cerrar sesión</button>
        </form>
      </section>
      <section className="aj-card in" style={{ animationDelay: '40ms' }} aria-labelledby="aj-mat">
        <h2 id="aj-mat">Material</h2>
        <p className="aj-mail">Tus PDFs por materia y cómo agregar unidades nuevas.</p>
        <Link href="/material" className="aj-link">Ver material</Link>
      </section>
    </main>
  )
}

export default function Page() {
  return <Suspense fallback={null}><Ajustes /></Suspense>
}
