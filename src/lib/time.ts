export const APP_TZ = 'America/Mexico_City'

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TZ })

/** YYYY-MM-DD en la zona de la app. */
export const toLocalDay = (d: Date): string => fmt.format(d)
