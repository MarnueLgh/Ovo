// Uso: npx tsx scripts/iconos.tsx — genera los íconos de la app a partir de la foca (src/components/Foca.tsx).
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { renderToStaticMarkup } from 'react-dom/server'
import { Foca } from '../src/components/Foca'

// La foca se asoma desde abajo; ojos y hocico quedan dentro de la zona segura de los íconos "maskable".
const foca = renderToStaticMarkup(<Foca />).replace('<svg ', '<svg x="-24" y="130" width="560" height="448" ')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B08CF2"/><stop offset="1" stop-color="#7A4FD8"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".8" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  ${foca.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')}
</svg>
`
writeFileSync('public/icons/ovo.svg', svg)
const out: [string, number][] = [['public/icons/icon-192.png', 192], ['public/icons/icon-512.png', 512], ['public/apple-touch-icon.png', 180]]
Promise.all(out.map(([file, size]) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file))).then(() => console.log('íconos listos'))
