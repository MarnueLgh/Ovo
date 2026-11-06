'use client'

import { useActionState } from 'react'
import { Foca } from '@/components/Foca'
import { Splash } from '@/components/Splash'
import { signIn } from './actions'
import './login.css'

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null)
  if (pending) return <Splash />
  return (
    <main className="login">
      <form className="login-card in" action={action}>
        <Foca className="foca" />
        <h1>ovo</h1>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        {state?.error && <p role="alert" className="login-error">{state.error}</p>}
        <button type="submit" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}
