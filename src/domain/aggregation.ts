import { kaufMenge, zuBasisEinheit } from './einheiten'
import { skaliereZutaten } from './skalierung'
import type { Kategorie, Rezept, Wochenplan, Zutat } from './typen'

export interface EinkaufsPosten {
  key: string
  name: string
  // Kaufmenge in der Basiseinheit, null bei Zutaten ohne Mengenangabe.
  menge: number | null
  einheit: string
  kategorie: Kategorie
}

const SONDERFORMEN: Record<string, string> = { eier: 'ei', äpfel: 'apfel', ei: 'ei' }

/** Vergleichswert für Namen: ohne Zusätze und ohne Plural-n ("Zwiebeln, gewürfelt" = "Zwiebel"). */
export function namenSchluessel(name: string): string {
  const basis = name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .split(',')[0]
    .trim()
    .replace(/\s+/g, ' ')
  if (SONDERFORMEN[basis]) return SONDERFORMEN[basis]
  return basis.replace(/(?<=[elr])n$/, '')
}

export function aggregiere(zutaten: Zutat[]): EinkaufsPosten[] {
  const posten = new Map<string, EinkaufsPosten>()
  for (const zutat of zutaten) {
    const basis = zutat.menge === null ? { menge: null, einheit: zutat.einheit } : zuBasisEinheit(zutat.menge, zutat.einheit)
    const key = `${namenSchluessel(zutat.name)}|${basis.einheit}`
    const vorhanden = posten.get(key)
    if (vorhanden) {
      if (basis.menge !== null) vorhanden.menge = (vorhanden.menge ?? 0) + basis.menge
    } else {
      posten.set(key, { key, name: zutat.name, menge: basis.menge, einheit: basis.einheit, kategorie: zutat.kategorie })
    }
  }
  return [...posten.values()].map((p) => ({ ...p, menge: p.menge === null ? null : kaufMenge(p.menge, p.einheit) }))
}

/**
 * Trifft exakt, auf das letzte Wort ("schwarzer Pfeffer") oder als Wortende mit
 * mindestens 3 Zeichen davor ("Olivenöl" zu "Öl", aber nicht "Reis" zu "Eis").
 */
export function istVorrat(name: string, vorrat: string[]): boolean {
  const zutat = namenSchluessel(name)
  const letztesWort = zutat.split(' ').at(-1) ?? zutat
  return vorrat.some((eintrag) => {
    const v = namenSchluessel(eintrag)
    if (!v) return false
    return zutat === v || letztesWort === v || (letztesWort.endsWith(v) && letztesWort.length - v.length >= 3)
  })
}

export interface Bedarf {
  posten: EinkaufsPosten[]
  ausVorrat: string[]
}

export function bedarfAusPlan(plan: Wochenplan, rezepte: Map<string, Rezept>, vorrat: string[]): Bedarf {
  const zutaten = plan.kocheintraege.flatMap((eintrag) => {
    const rezept = rezepte.get(eintrag.rezeptId)
    return rezept ? skaliereZutaten(rezept.zutaten, rezept.basisPortionen, eintrag.portionen) : []
  })
  const brauchbar = zutaten.filter((z) => !istVorrat(z.name, vorrat))
  const ausVorrat = zutaten.filter((z) => istVorrat(z.name, vorrat)).map((z) => z.name)
  return { posten: aggregiere(brauchbar), ausVorrat: [...new Set(ausVorrat)] }
}
