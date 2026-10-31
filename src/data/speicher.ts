import type { EinkaufDaten, ManuellerEintrag, Rezept, Wochenplan } from '../domain/typen'

export type Abmelden = () => void
export type FehlerCallback = (fehler: unknown) => void

export const LEERER_EINKAUF: EinkaufDaten = { abgehakt: {}, manuell: {} }
export const START_VORRAT = ['Salz', 'Pfeffer', 'Öl']

// Schreibzugriffe warten bewusst nicht auf den Server: Offline würden sie sonst nie fertig.
export interface Speicher {
  neueId(): string
  rezepteBeobachten(callback: (rezepte: Rezept[]) => void, fehler: FehlerCallback): Abmelden
  rezeptSpeichern(rezept: Rezept): void
  rezeptLoeschen(id: string): void
  wocheBeobachten(wocheId: string, callback: (plan: Wochenplan | null) => void, fehler: FehlerCallback): Abmelden
  wocheLesen(wocheId: string): Promise<Wochenplan | null>
  wocheSpeichern(wocheId: string, plan: Wochenplan): void
  einkaufBeobachten(wocheId: string, callback: (daten: EinkaufDaten) => void, fehler: FehlerCallback): Abmelden
  abhakenSetzen(wocheId: string, key: string, menge: number | null | undefined): void
  manuellSetzen(wocheId: string, eintrag: ManuellerEintrag): void
  manuellLoeschen(wocheId: string, id: string): void
  vorratBeobachten(callback: (vorrat: string[]) => void, fehler: FehlerCallback): Abmelden
  vorratSpeichern(vorrat: string[]): void
}
