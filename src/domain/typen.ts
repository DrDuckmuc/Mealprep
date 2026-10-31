export const KATEGORIEN = [
  'Obst & Gemüse',
  'Kühlregal',
  'Fleisch/Fisch',
  'Trockenware',
  'Gewürze',
  'Sonstiges',
] as const
export type Kategorie = (typeof KATEGORIEN)[number]

export interface Zutat {
  menge: number | null
  einheit: string
  name: string
  kategorie: Kategorie
}

export interface Rezept {
  id: string
  name: string
  link: string
  basisPortionen: number
  zutaten: Zutat[]
  zubereitung: string
  kuehlschrankTage: number | null
  einfrierbar: boolean
  notizen: string
  // Data-URL. null statt undefined, weil Firestore undefined ablehnt; ältere Rezepte haben das Feld nicht.
  bild?: string | null
}

// 'sa' und 'so' sind das Wochenende VOR dem Montag der Woche: die Vorkoch-Tage.
export const TAGE = ['sa', 'so', 'mo', 'di', 'mi', 'do', 'fr'] as const
export type Tag = (typeof TAGE)[number]
export type Mahlzeit = 'mittag' | 'abend'
export type SlotId = `${Tag}-${Mahlzeit}`

export interface Kocheintrag {
  id: string
  rezeptId: string
  // Falls das Rezept später gelöscht wird, bleibt der Plan lesbar.
  rezeptName: string
  kochSlot: SlotId
  portionen: number
}

export type SlotInhalt = { art: 'kochen'; kochId: string } | { art: 'text'; text: string }

export interface Wochenplan {
  kocheintraege: Kocheintrag[]
  slots: Partial<Record<SlotId, SlotInhalt>>
}

export interface ManuellerEintrag {
  id: string
  text: string
  kategorie: Kategorie
  abgehakt: boolean
}

export interface EinkaufDaten {
  // Schlüssel → abgehakte Menge. Steigt der Bedarf später, bleibt nur die Differenz offen.
  abgehakt: Record<string, number | null>
  manuell: Record<string, ManuellerEintrag>
}
