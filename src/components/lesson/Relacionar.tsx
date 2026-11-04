'use client'

import { useEffect, useRef, useState } from 'react'
import { gradeRelacionar } from '@/lib/exercises/grade'
import type { Relacionar as Payload } from '@/lib/exercises/types'
import { CheckBar, type ExerciseProps } from './CheckBar'

const COLORS = ['#7A4FD8', '#1F86CF', '#E3743F', '#2EA864']

type Pt = [number, number]
const curve = (a: Pt, b: Pt) => {
  const dx = Math.max(40, (b[0] - a[0]) / 2)
  return `M${a[0]},${a[1]} C${a[0] + dx},${a[1]} ${b[0] - dx},${b[1]} ${b[0]},${b[1]}`
}

/** Orden de la columna derecha: barajado una vez por montaje, determinista (sin Math.random, no rompe la hidratación). */
function shuffled(n: number, seedText: string): number[] {
  let s = [...seedText].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), s | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const a = [...Array(n).keys()]
  for (let k = n - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1))
    ;[a[k], a[j]] = [a[j], a[k]]
  }
  return a.every((v, k) => v === k) ? [...a.slice(1), a[0]] : a
}

export function Relacionar({ payload: p, onResult, onContinue, saving, note }: ExerciseProps<Payload>) {
  const n = p.pairs.length
  const [order] = useState(() => shuffled(n, p.prompt))
  const [done, setDone] = useState<number[]>([])
  const [wires, setWires] = useState<{ i: number; d: string }[]>([])
  const [bad, setBad] = useState<{ j: number; n: number } | null>(null)
  const [armed, setArmed] = useState<number | null>(null)
  const [firstTry, setFirstTry] = useState<number | null>(null)

  const matchRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<SVGPathElement>(null)
  const lp = useRef<(HTMLElement | null)[]>([])
  const rp = useRef<(HTMLElement | null)[]>([])
  const connected = useRef(new Set<number>())
  const first = useRef<boolean[]>([]) // resultado del primer intento de soltar de cada par
  const stopDrag = useRef<(() => void) | null>(null)

  const center = (el: HTMLElement): Pt => {
    const r = el.getBoundingClientRect()
    const m = matchRef.current!.getBoundingClientRect()
    return [r.left + r.width / 2 - m.left, r.top + r.height / 2 - m.top]
  }
  const wirePath = (i: number) => curve(center(lp.current[i]!), center(rp.current[i]!))

  // Si cambia el tamaño (giro, fuentes), los cables ya conectados se recalculan.
  useEffect(() => {
    const m = matchRef.current
    if (!m) return
    const ro = new ResizeObserver(() => setWires((w) => w.map(({ i }) => ({ i, d: wirePath(i) }))))
    ro.observe(m)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => () => stopDrag.current?.(), [])

  /** i = par del término soltado, j = par de la definición sobre la que cayó. */
  function tryConnect(i: number, j: number) {
    if (connected.current.has(i) || connected.current.has(j)) return
    const ok = i === j
    if (first.current[i] === undefined) first.current[i] = ok
    if (!ok) {
      setBad((b) => ({ j, n: (b?.n ?? 0) + 1 }))
      return
    }
    setBad(null)
    connected.current.add(i)
    setDone([...connected.current])
    setWires((w) => [...w, { i, d: wirePath(i) }])
    if (connected.current.size === n) {
      const ft = first.current.filter(Boolean).length
      setFirstTry(ft)
      onResult(gradeRelacionar(n, ft))
    }
  }

  function startDrag(e: React.PointerEvent, i: number) {
    if (connected.current.has(i) || e.button !== 0) return
    stopDrag.current?.() // cierra un arrastre previo (otro puntero) para no filtrar listeners
    e.preventDefault()
    const path = dragRef.current!
    const a = center(lp.current[i]!)
    path.setAttribute('stroke', COLORS[i % COLORS.length])
    const move = (ev: PointerEvent) => {
      const m = matchRef.current!.getBoundingClientRect()
      path.setAttribute('d', curve(a, [ev.clientX - m.left, ev.clientY - m.top]))
    }
    const stop = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', stop)
      path.removeAttribute('d')
      stopDrag.current = null
    }
    const up = (ev: PointerEvent) => {
      stop()
      const card = document.elementsFromPoint(ev.clientX, ev.clientY).map((el) => el.closest<HTMLElement>('.R .it')).find(Boolean)
      if (card) tryConnect(i, Number(card.dataset.i))
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', stop)
    stopDrag.current = stop
  }

  const all = firstTry !== null

  return (
    <>
      <span className="kind">🔌 Relacionar</span>
      <h1>{p.prompt}</h1>
      <p className="lead">Arrastra el conector negro hasta la definición correcta. Con teclado: Enter en el conector y luego Enter en la definición.</p>
      <div className="match" ref={matchRef}>
        <svg className="wires" aria-hidden="true">
          {wires.map(({ i, d }) => <path key={i} d={d} stroke={COLORS[i % COLORS.length]} />)}
          <path ref={dragRef} />
        </svg>
        <div className="col L">
          {p.pairs.map((pair, i) => (
            <div key={pair.term} className={`it${done.includes(i) ? ' ok' : ''}`}>
              {pair.term}
              <button
                type="button"
                className={`plug${armed === i ? ' arm' : ''}`}
                ref={(el) => { lp.current[i] = el }}
                aria-label={`Conectar: ${pair.term}`}
                aria-pressed={armed === i}
                disabled={done.includes(i)}
                onPointerDown={(e) => startDrag(e, i)}
                onClick={(e) => e.detail === 0 && setArmed((a) => (a === i ? null : i))}
              />
            </div>
          ))}
        </div>
        <div className="col R">
          {order.map((j) => (
            <button
              key={j}
              type="button"
              data-i={j}
              className={`it${done.includes(j) ? ' ok' : ''}${bad?.j === j ? (bad.n % 2 ? ' bad-a' : ' bad-b') : ''}`}
              onClick={() => {
                if (armed !== null) tryConnect(armed, j)
                setArmed(null)
              }}
            >
              <span className="plug" ref={(el) => { rp.current[j] = el }} aria-hidden="true" />
              {p.pairs[j].definition}
            </button>
          ))}
        </div>
      </div>
      <CheckBar
        tone={all ? 'ok' : undefined}
        title={all ? '¡Todo conectado!' : undefined}
        sub={all ? `${firstTry} de ${n} a la primera` : bad ? 'Esa no es, prueba con otra definición' : `Conecta los ${n} pares`}
        label="Continuar"
        disabled={!all || saving}
        onClick={onContinue}
        note={note}
      />
    </>
  )
}
