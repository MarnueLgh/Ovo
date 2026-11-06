import { Foca } from './Foca'
import './splash.css'

export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando ovo">
      <h1 className="splash-word">ovo</h1>
      <p className="splash-dots" aria-hidden="true">
        <span /><span /><span />
      </p>
      <div className="splash-foca">
        <Foca />
      </div>
    </div>
  )
}
