import type { EinkaufDaten, Rezept, Wochenplan } from '../domain/typen'
import { LEERER_EINKAUF, START_VORRAT, type Speicher } from './speicher'

const PREFIX = 'mealprep-demo:'
const beobachter = new Map<string, Set<() => void>>()

function lesen<T>(key: string, standard: T): T {
  const wert = localStorage.getItem(PREFIX + key)
  return wert === null ? standard : (JSON.parse(wert) as T)
}

function schreiben(key: string, wert: unknown): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(wert))
  beobachter.get(key)?.forEach((melden) => melden())
}

function beobachten<T>(key: string, standard: T, callback: (wert: T) => void) {
  const melden = () => callback(lesen(key, standard))
  const liste = beobachter.get(key) ?? new Set()
  beobachter.set(key, liste.add(melden))
  melden()
  return () => void liste.delete(melden)
}

/** Demo-Modus für `npm run dev` ohne Firebase: Daten bleiben nur in diesem Browser. */
export function lokalerSpeicher(): Speicher {
  const rezepte = () => lesen<Rezept[]>('rezepte', [])
  const einkauf = (wocheId: string) => lesen<EinkaufDaten>(`einkauf/${wocheId}`, LEERER_EINKAUF)

  return {
    neueId: () => crypto.randomUUID(),

    rezepteBeobachten: (callback) => beobachten('rezepte', [], callback),
    rezeptSpeichern: (rezept) => schreiben('rezepte', [...rezepte().filter((r) => r.id !== rezept.id), rezept]),
    rezeptLoeschen: (id) => schreiben('rezepte', rezepte().filter((r) => r.id !== id)),

    wocheBeobachten: (wocheId, callback) => beobachten<Wochenplan | null>(`wochen/${wocheId}`, null, callback),
    wocheLesen: async (wocheId) => lesen<Wochenplan | null>(`wochen/${wocheId}`, null),
    wocheSpeichern: (wocheId, plan) => schreiben(`wochen/${wocheId}`, plan),

    einkaufBeobachten: (wocheId, callback) => beobachten(`einkauf/${wocheId}`, LEERER_EINKAUF, callback),
    abhakenSetzen: (wocheId, key, menge) => {
      const daten = einkauf(wocheId)
      const abgehakt = { ...daten.abgehakt }
      const abgehaktAm = { ...daten.abgehaktAm }
      if (menge === undefined) {
        delete abgehakt[key]
        delete abgehaktAm[key]
      } else {
        abgehakt[key] = menge
        abgehaktAm[key] = Date.now()
      }
      schreiben(`einkauf/${wocheId}`, { ...daten, abgehakt, abgehaktAm })
    },
    manuellSetzen: (wocheId, eintrag) => {
      const daten = einkauf(wocheId)
      schreiben(`einkauf/${wocheId}`, { ...daten, manuell: { ...daten.manuell, [eintrag.id]: eintrag } })
    },
    manuellLoeschen: (wocheId, id) => {
      const daten = einkauf(wocheId)
      const manuell = { ...daten.manuell }
      delete manuell[id]
      schreiben(`einkauf/${wocheId}`, { ...daten, manuell })
    },

    vorratBeobachten: (callback) => beobachten('vorrat', START_VORRAT, callback),
    vorratSpeichern: (vorrat) => schreiben('vorrat', vorrat),
  }
}
