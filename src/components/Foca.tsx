/** La mascota de ovo: una foca. `feliz` cierra los ojos y abre la boca (pantalla de logro). */
export function Foca({ feliz = false, className }: { feliz?: boolean; className?: string }) {
  const ink = '#1B1530'
  return (
    <svg className={className} viewBox="0 0 200 160" aria-hidden="true" focusable="false">
      {/* cabeza redonda, sin orejas, con luz arriba */}
      <ellipse cx="100" cy="92" rx="90" ry="68" fill="#9DB0C6" />
      <ellipse cx="100" cy="86" rx="83" ry="60" fill="#BFCCDC" />
      <ellipse cx="74" cy="50" rx="42" ry="16" fill="#fff" opacity=".18" />
      {/* mejillas */}
      <ellipse cx="38" cy="104" rx="14" ry="8" fill="#FF9E86" opacity=".5" />
      <ellipse cx="162" cy="104" rx="14" ry="8" fill="#FF9E86" opacity=".5" />
      {feliz ? (
        <>
          <g fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round">
            <path d="M52 86Q64 72 76 86" />
            <path d="M124 86Q136 72 148 86" />
          </g>
          <path d="M90 130Q100 148 110 130Z" fill={ink} stroke={ink} strokeWidth="5" strokeLinejoin="round" />
        </>
      ) : (
        <g className="eyes">
          <ellipse cx="64" cy="82" rx="12" ry="14" fill={ink} />
          <ellipse cx="136" cy="82" rx="12" ry="14" fill={ink} />
          <circle cx="68" cy="76" r="4.5" fill="#fff" />
          <circle cx="140" cy="76" r="4.5" fill="#fff" />
        </g>
      )}
      {/* hocico: dos cachetes con puntitos de bigote */}
      <circle cx="87" cy="112" r="17" fill="#EEF3F8" />
      <circle cx="113" cy="112" r="17" fill="#EEF3F8" />
      <g fill="#9DB0C6">
        <circle cx="80" cy="110" r="2.2" /><circle cx="88" cy="117" r="2.2" /><circle cx="78" cy="119" r="2.2" />
        <circle cx="120" cy="110" r="2.2" /><circle cx="112" cy="117" r="2.2" /><circle cx="122" cy="119" r="2.2" />
      </g>
      <path d="M91 99Q100 94 109 99Q108 107 100 109Q92 107 91 99Z" fill={ink} />
    </svg>
  )
}
