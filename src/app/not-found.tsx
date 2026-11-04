import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="nf">
      <h1>No encontramos esa página</h1>
      <p>Puede que la lección ya no exista o que el enlace esté mal.</p>
      <Link href="/">Volver al inicio</Link>
    </main>
  )
}
