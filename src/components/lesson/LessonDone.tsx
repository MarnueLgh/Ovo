'use client'

const EGG = 'M200 20C318 20 380 190 380 290C380 410 300 480 200 480S20 410 20 290C20 190 82 20 200 20Z'

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
      <div className="logro-egg" aria-hidden="true">
        <span className="spark s1">✦</span><span className="spark s2">✦</span><span className="spark s3">✦</span>
        <svg viewBox="0 0 400 500">
          <defs><clipPath id="done-egg-clip"><path d={EGG} /></clipPath></defs>
          <path d={EGG} fill="#F2DDAE" />
          <g clipPath="url(#done-egg-clip)"><path d={EGG} fill="#FFF6E0" transform="translate(-16 -14)" /></g>
          <g fill="none" stroke="#1B1530" strokeWidth="14" strokeLinecap="round">
            <path d="M100 200Q135 155 170 200" />
            <path d="M230 200Q265 155 300 200" />
          </g>
          <ellipse cx="92" cy="262" rx="26" ry="14" fill="#FFB48C" opacity=".7" />
          <ellipse cx="308" cy="262" rx="26" ry="14" fill="#FFB48C" opacity=".7" />
          <path d="M160 248Q200 310 240 248Z" fill="#1B1530" stroke="#1B1530" strokeWidth="8" strokeLinejoin="round" />
        </svg>
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
