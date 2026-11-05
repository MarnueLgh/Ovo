import './splash.css'

export default function Loading() {
  return (
    <div className="splash" role="status" aria-label="Cargando Ovo">
      <h1 className="splash-word">Ovo</h1>
      <p className="splash-dots" aria-hidden="true">
        <span /><span /><span />
      </p>
      <div className="splash-egg" aria-hidden="true">
        <svg viewBox="0 0 400 480">
          <defs>
            <clipPath id="splash-egg-clip">
              <path d="M200 20C318 20 380 190 380 290C380 410 300 480 200 480S20 410 20 290C20 190 82 20 200 20Z" />
            </clipPath>
          </defs>
          <path d="M200 20C318 20 380 190 380 290C380 410 300 480 200 480S20 410 20 290C20 190 82 20 200 20Z" fill="#F2DDAE" />
          <g clipPath="url(#splash-egg-clip)">
            <path d="M184 6C302 6 364 176 364 276C364 396 284 466 184 466S4 396 4 276C4 176 66 6 184 6Z" fill="#FFF6E0" />
          </g>
          <g className="brows" fill="none" stroke="#1B1530" strokeWidth="11" strokeLinecap="round">
            <path d="M104 112Q132 92 160 108" />
            <path d="M240 108Q268 92 296 112" />
          </g>
          <g className="eyes">
            <circle cx="135" cy="180" r="50" fill="#fff" />
            <circle cx="265" cy="180" r="50" fill="#fff" />
            <g className="pupils">
              <circle cx="140" cy="186" r="27" fill="#1B1530" />
              <circle cx="270" cy="186" r="27" fill="#1B1530" />
              <circle cx="130" cy="175" r="9" fill="#fff" />
              <circle cx="260" cy="175" r="9" fill="#fff" />
            </g>
          </g>
          <ellipse cx="96" cy="258" rx="24" ry="13" fill="#FFB48C" opacity=".6" />
          <ellipse cx="304" cy="258" rx="24" ry="13" fill="#FFB48C" opacity=".6" />
          <path d="M184 252Q200 266 216 252" fill="none" stroke="#1B1530" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
