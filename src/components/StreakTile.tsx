export function StreakTile({ current, best }: { current: number; best: number }) {
  return (
    <div className="tile t-fuego in" style={{ animationDelay: '40ms' }}>
      <h2 className="k">Racha</h2>
      <p className="v">
        <span className="flame" aria-hidden="true">🔥</span> {current} {current === 1 ? 'día' : 'días'}
      </p>
      <p className="k" style={{ marginTop: 4 }}>
        {current > 0 ? 'Haz 1 lección hoy para mantenerla' : 'Haz 1 lección hoy para empezar una'}
        {best > 0 && ` · Récord: ${best}`}
      </p>
    </div>
  )
}
