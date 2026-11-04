import type { Source } from '@/lib/exercises/types'

export type ExerciseResult = { score: number; correct: boolean }

/** Props comunes de los ejercicios. `onContinue(kb)`: kb=true si el clic vino del teclado (sin animación). */
export type ExerciseProps<P> = {
  payload: P
  source: Source | null
  onResult: (r: ExerciseResult) => void
  onContinue: (kb: boolean) => void
  saving: boolean
  note: string | null
}

type Props = {
  tone?: 'ok' | 'no'
  title?: string
  sub?: string
  label: string
  disabled?: boolean
  onClick: (kb: boolean) => void
  why?: { open: boolean; onToggle: (kb: boolean) => void }
  note?: string | null
  other?: { label: string; onClick: () => void }
}

export function CheckBar({ tone, title, sub, label, disabled, onClick, why, note, other }: Props) {
  return (
    <footer className={`bar${tone ? ` ${tone}` : ''}`}>
      <div className="msg" aria-live="polite">
        {title && <b>{title}</b>}
        {sub && <span>{sub}</span>}
        {note && <span className="note">{note}</span>}
      </div>
      {other && <button type="button" className="btn why" onClick={other.onClick}>{other.label}</button>}
      {why && (
        <button type="button" className="btn why" aria-expanded={why.open} aria-controls="explain" onClick={(e) => why.onToggle(e.detail === 0)}>
          ¿Por qué?
        </button>
      )}
      <button type="button" className="btn" disabled={disabled} onClick={(e) => onClick(e.detail === 0)}>
        {label}
      </button>
    </footer>
  )
}
