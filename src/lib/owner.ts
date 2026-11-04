/** ¿Es este correo el único usuario permitido (OVO_EMAIL, solo servidor)? Sin OVO_EMAIL se deniega todo. */
export function isOwner(email: unknown, owner = process.env.OVO_EMAIL) {
  const o = owner?.trim().toLowerCase()
  return !!o && typeof email === 'string' && email.trim().toLowerCase() === o
}
