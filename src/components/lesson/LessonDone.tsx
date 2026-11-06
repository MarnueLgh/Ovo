'use client'

import { Foca } from '@/components/Foca'

type Props = { study: boolean; correct: number; total: number; ms: number; onContinue: () => void }

function cheer(study: boolean, ratio: number) {
  if (study) return ['¡Estudio terminado!', 'Ya tienes las ideas frescas para practicar.']
  if (ratio === 1) return ['¡Perfecto!', 'Ni un solo error. Así se hace.']
  if (ratio >= 0.7) return ['¡Muy bien!', 'Vas dominando este tema.']
  return ['¡Lección completada!', 'Cada intento cuenta. Lo vas a lograr.']
}

function fmtTime(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return m ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s} s`
}

export function LessonDone({ study, correct, total, ms, onContinue }: Props) {
  const ratio = total ? correct / total : 1
  const [title, sub] = cheer(study, ratio)
  return (
    <main className="logro">
      <div className="logro-foca" aria-hidden="true">
        <span className="spark s1">✦</span><span className="spark s2">✦</span><span className="spark s3">✦</span>
        <Foca feliz />
      </div>
      <h1>{title}</h1>
      <p className="lead">{sub}</p>
      <dl className="stats">
        <div className="stat ok">
          <dt>{study ? 'Tarjetas' : 'Aciertos'}</dt>
          <dd>{study ? total : `${correct}/${total}`}</dd>
        </div>
        <div className="stat time">
          <dt>Tiempo</dt>
          <dd>{fmtTime(ms)}</dd>
        </div>
      </dl>
      <button type="button" className="btn go" autoFocus onClick={onContinue}>Continuar</button>
    </main>
  )
}
