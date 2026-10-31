import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { firebaseAuth } from '../data/firebase'

const istInstalliert = () => window.matchMedia('(display-mode: standalone)').matches
const istAndroid = () => /Android/i.test(navigator.userAgent)

// Die installierte PWA teilt ihren Speicher mit Chrome: Eine Anmeldung dort gilt auch hier.
function chromeLink(): string {
  const { host, pathname, href } = window.location
  return `intent://${host}${pathname}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`
}

const FEHLERTEXTE: Record<string, string> = {
  'auth/popup-blocked': 'Das Anmeldefenster wurde blockiert.',
  'auth/popup-closed-by-user': 'Die Anmeldung wurde nicht abgeschlossen.',
  'auth/cancelled-popup-request': 'Die Anmeldung wurde nicht abgeschlossen.',
  'auth/unauthorized-domain': 'Diese Domain ist in Firebase noch nicht autorisiert (siehe README).',
  'auth/network-request-failed': 'Keine Verbindung. Für die erste Anmeldung brauchst du Internet.',
}

export function Login() {
  const [fehler, setFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)

  async function anmelden() {
    setLaeuft(true)
    setFehler('')
    try {
      await signInWithPopup(firebaseAuth(), new GoogleAuthProvider())
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      setFehler(FEHLERTEXTE[code] ?? `Anmeldung fehlgeschlagen (${code || 'unbekannter Fehler'}).`)
      setLaeuft(false)
    }
  }

  return (
    <main className="zentriert">
      <h1>Mealprep</h1>
      <p className="gedaempft">Wochenplan und Einkaufsliste</p>
      <button className="knopf primaer" onClick={anmelden} disabled={laeuft}>
        Mit Google anmelden
      </button>
      {fehler && <p className="fehler-text">{fehler}</p>}
      {istInstalliert() && istAndroid() && (
        <div className="login-hilfe">
          <p className="gedaempft">Klappt die Anmeldung in der installierten App nicht? Melde dich in Chrome an und öffne die App danach wieder.</p>
          <a className="knopf" href={chromeLink()}>
            In Chrome anmelden
          </a>
        </div>
      )}
    </main>
  )
}
