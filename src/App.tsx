import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { AppDatenProvider, useAppDaten } from './data/AppDaten'
import { firebaseAuth, firebaseKonfiguriert } from './data/firebase'
import { firestoreSpeicher } from './data/firestoreSpeicher'
import { lokalerSpeicher } from './data/lokalerSpeicher'
import { BuchIcon, KalenderIcon, KorbIcon, PersonIcon } from './ui/Icons'
import { navigieren, useRoute } from './ui/router'
import { Sheet } from './ui/Sheet'
import { Einkauf } from './views/Einkauf'
import { Login } from './views/Login'
import { RezeptDetail, RezeptListe } from './views/Rezepte'
import { RezeptForm } from './views/RezeptForm'
import { Woche } from './views/Woche'

const demoModus = !firebaseKonfiguriert && import.meta.env.DEV

function onlineAbonnieren(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnline(): boolean {
  return useSyncExternalStore(onlineAbonnieren, () => navigator.onLine)
}

function fehlerText(fehler: unknown, uid: string | undefined): string {
  const code = (fehler as { code?: string }).code
  if (code === 'permission-denied') {
    return `Kein Zugriff auf die Daten. Trage diese UID in die Security Rules ein: ${uid ?? 'unbekannt'}`
  }
  if (code === 'unavailable') return 'Das geht gerade nicht ohne Internet.'
  return `Fehler: ${fehler instanceof Error ? fehler.message : String(fehler)}`
}

function KontoSheet({ user, onSchliessen }: { user: User | null; onSchliessen: () => void }) {
  return (
    <Sheet titel="Konto" onSchliessen={onSchliessen}>
      {user ? (
        <>
          <p>{user.email}</p>
          <p className="gedaempft klein-text">UID für die Security Rules:</p>
          <code className="uid">{user.uid}</code>
          <button className="knopf gefahr breit" onClick={() => signOut(firebaseAuth())}>Abmelden</button>
        </>
      ) : (
        <p>Demo-Modus: Es gibt kein Konto, die Daten bleiben nur in diesem Browser.</p>
      )}
    </Sheet>
  )
}

function Tab({ pfad, aktiv, label, children }: { pfad: string; aktiv: boolean; label: string; children: ReactNode }) {
  return (
    <button className={aktiv ? 'aktiv' : ''} onClick={() => navigieren(pfad)} aria-current={aktiv ? 'page' : undefined}>
      {children}
      {label}
    </button>
  )
}

function Ansicht({ route, user }: { route: string; user: User | null }) {
  const { geladen } = useAppDaten()
  const [bereich, id, aktion] = route.split('/')
  // Vor dem Laden wäre das Formular leer, und Speichern legte ein zweites Rezept an.
  if (bereich === 'rezepte' && id && !geladen) return <main className="gedaempft mitte">Lädt …</main>
  if (bereich === 'rezepte' && id === 'neu') return <RezeptForm />
  if (bereich === 'rezepte' && id && aktion === 'bearbeiten') return <RezeptForm key={id} id={id} />
  if (bereich === 'rezepte' && id) return <RezeptDetail key={id} id={id} />
  if (bereich === 'rezepte') return <RezeptListe />
  if (bereich === 'einkauf') return <Einkauf />
  return <Woche user={user} />
}

function Shell({ user }: { user: User | null }) {
  const route = useRoute()
  const online = useOnline()
  const { fehler } = useAppDaten()
  const [kontoOffen, setKontoOffen] = useState(false)
  const bereich = route.split('/')[0]

  return (
    <>
      <header className="app-kopf">
        <span className="app-name">Mealprep</span>
        {!online && <span className="badge">Offline</span>}
        {demoModus && <span className="badge">Demo</span>}
        <button className="icon-knopf" onClick={() => setKontoOffen(true)} aria-label="Konto">
          <PersonIcon />
        </button>
      </header>
      {fehler ? <p className="banner">{fehlerText(fehler, user?.uid)}</p> : null}
      <Ansicht route={route} user={user} />
      <nav className="tabs">
        <Tab pfad="woche" aktiv={bereich === 'woche'} label="Woche"><KalenderIcon /></Tab>
        <Tab pfad="rezepte" aktiv={bereich === 'rezepte'} label="Rezepte"><BuchIcon /></Tab>
        <Tab pfad="einkauf" aktiv={bereich === 'einkauf'} label="Einkauf"><KorbIcon /></Tab>
      </nav>
      {kontoOffen && <KontoSheet user={user} onSchliessen={() => setKontoOffen(false)} />}
    </>
  )
}

function DatenApp({ user }: { user: User | null }) {
  const [fehler, setFehler] = useState<unknown>(null)
  const fehlerMelden = useCallback((e: unknown) => {
    console.error(e)
    setFehler(e)
  }, [])
  const uid = user?.uid
  const speicher = useMemo(
    () => (uid ? firestoreSpeicher(uid, fehlerMelden) : lokalerSpeicher()),
    [uid, fehlerMelden],
  )
  return (
    <AppDatenProvider speicher={speicher} fehler={fehler} fehlerMelden={fehlerMelden}>
      <Shell user={user} />
    </AppDatenProvider>
  )
}

function FirebaseApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(firebaseAuth(), setUser), [])

  if (user === undefined) return <main className="zentriert gedaempft">Lädt …</main>
  return user ? <DatenApp key={user.uid} user={user} /> : <Login />
}

export function App() {
  if (firebaseKonfiguriert) return <FirebaseApp />
  if (demoModus) return <DatenApp user={null} />
  return (
    <main className="zentriert">
      <h1>Mealprep</h1>
      <p>Die Firebase-Konfiguration fehlt. Trage die GitHub Secrets ein (siehe README) und starte den Deploy neu.</p>
    </main>
  )
}
