import type { EinkaufsPosten } from './aggregation'
import { formatMenge } from './einheiten'
import { KATEGORIEN, type EinkaufDaten, type Kategorie } from './typen'

export interface ListenEintrag {
  id: string
  name: string
  mengeText: string
  kategorie: Kategorie
  abgehakt: boolean
  manuell: boolean
  // Wert, der beim Abhaken gespeichert wird.
  menge: number | null
  hinweis?: string
}

export function listenEintraege(posten: EinkaufsPosten[], daten: EinkaufDaten): ListenEintrag[] {
  const generiert = posten.map((p): ListenEintrag => {
    const basis = { id: p.key, name: p.name, kategorie: p.kategorie, manuell: false, menge: p.menge }
    const mengeText = formatMenge(p.menge, p.einheit)
    if (!(p.key in daten.abgehakt)) return { ...basis, mengeText, abgehakt: false }

    const erledigt = daten.abgehakt[p.key]
    if (p.menge !== null && erledigt !== null && p.menge > erledigt) {
      return {
        ...basis,
        mengeText: formatMenge(p.menge - erledigt, p.einheit),
        abgehakt: false,
        hinweis: `${formatMenge(erledigt, p.einheit)} schon abgehakt`,
      }
    }
    return { ...basis, mengeText, abgehakt: true }
  })
  const manuell = Object.values(daten.manuell).map(
    (m): ListenEintrag => ({ id: m.id, name: m.text, mengeText: '', kategorie: m.kategorie, abgehakt: m.abgehakt, manuell: true, menge: null }),
  )
  return [...generiert, ...manuell]
}

export interface ListenGruppe {
  kategorie: Kategorie
  eintraege: ListenEintrag[]
}

export function nachKategorie(eintraege: ListenEintrag[]): ListenGruppe[] {
  return KATEGORIEN.map((kategorie) => ({
    kategorie,
    eintraege: eintraege.filter((e) => e.kategorie === kategorie).sort((a, b) => a.name.localeCompare(b.name, 'de')),
  })).filter((gruppe) => gruppe.eintraege.length > 0)
}

/** Text zum Teilen: nur die offenen Einträge, denn nur die muss noch jemand kaufen. */
export function listeAlsText(titel: string, eintraege: ListenEintrag[]): string {
  const gruppen = nachKategorie(eintraege.filter((e) => !e.abgehakt)).map((gruppe) =>
    [gruppe.kategorie, ...gruppe.eintraege.map((e) => `- ${e.mengeText ? `${e.mengeText} ` : ''}${e.name}`)].join('\n'),
  )
  return [titel, ...gruppen].join('\n\n')
}
