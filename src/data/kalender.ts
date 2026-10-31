import { GoogleAuthProvider, reauthenticateWithPopup, type User } from 'firebase/auth'
import { terminDaten, terminId, type KalenderTermin } from '../domain/kalender'
import { TAGE } from '../domain/typen'

const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
// Google vergibt Tokens für eine Stunde; etwas Puffer, damit keins mitten im Abgleich abläuft.
const TOKEN_DAUER_MS = 50 * 60_000

let zugang: { token: string; gueltigBis: number } | null = null

async function zugriffsToken(user: User): Promise<string> {
  if (zugang && Date.now() < zugang.gueltigBis) return zugang.token

  const provider = new GoogleAuthProvider()
  provider.addScope(SCOPE)
  provider.setCustomParameters({ login_hint: user.email ?? '' })
  const ergebnis = await reauthenticateWithPopup(user, provider)
  const token = GoogleAuthProvider.credentialFromResult(ergebnis)?.accessToken
  if (!token) throw new Error('Google hat keinen Kalender-Zugriff erteilt.')

  zugang = { token, gueltigBis: Date.now() + TOKEN_DAUER_MS }
  return token
}

export class KalenderFehler extends Error {
  constructor(
    readonly status: number,
    text: string,
  ) {
    super(text)
  }
}

async function pruefen(antwort: Response): Promise<void> {
  if (!antwort.ok) throw new KalenderFehler(antwort.status, await antwort.text())
}

/**
 * Gleicht alle Abende der Woche ab: Abende mit Termin werden geschrieben, die anderen geleert.
 * PUT belebt auch einen früher gelöschten Termin wieder, POST legt nur wirklich neue an.
 */
export async function termineSchreiben(token: string, wocheId: string, termine: KalenderTermin[]): Promise<void> {
  const kopf = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  for (const tag of TAGE) {
    const id = terminId(wocheId, tag)
    const url = `${EVENTS_URL}/${id}`
    const termin = termine.find((t) => t.tag === tag)

    if (!termin) {
      const antwort = await fetch(url, { method: 'DELETE', headers: kopf })
      if (antwort.status !== 404 && antwort.status !== 410) await pruefen(antwort)
      continue
    }

    const body = JSON.stringify({ id, ...terminDaten(termin) })
    const antwort = await fetch(url, { method: 'PUT', headers: kopf, body })
    await pruefen(antwort.status === 404 ? await fetch(EVENTS_URL, { method: 'POST', headers: kopf, body }) : antwort)
  }
}

export async function kalenderAbgleichen(user: User, wocheId: string, termine: KalenderTermin[]): Promise<void> {
  const token = await zugriffsToken(user)
  try {
    await termineSchreiben(token, wocheId, termine)
  } catch (e) {
    // Ein abgelehntes Token nicht wiederverwenden, sondern beim nächsten Versuch neu holen.
    if (e instanceof KalenderFehler && (e.status === 401 || e.status === 403)) zugang = null
    throw e
  }
}

export function kalenderFehlerText(fehler: unknown): string {
  if (fehler instanceof KalenderFehler) {
    if (fehler.status === 401) return 'Die Kalender-Freigabe ist abgelaufen. Tippe bitte noch einmal.'
    if (/accessNotConfigured|SERVICE_DISABLED/.test(fehler.message)) {
      return 'Die Google Calendar API ist noch nicht aktiviert (siehe README).'
    }
    if (fehler.status === 403) return 'Der Kalender-Zugriff wurde nicht erlaubt. Setze beim Google-Fenster den Haken für den Kalender.'
    return `Der Kalender hat den Abgleich abgelehnt (Fehler ${fehler.status}).`
  }
  const code = (fehler as { code?: string }).code
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'Die Freigabe wurde nicht abgeschlossen.'
  if (code === 'auth/popup-blocked') return 'Das Google-Fenster wurde blockiert.'
  if (code === 'auth/user-mismatch') return 'Bitte wähle das Konto, mit dem du in der App angemeldet bist.'
  return `Abgleich fehlgeschlagen: ${fehler instanceof Error ? fehler.message : String(fehler)}`
}
