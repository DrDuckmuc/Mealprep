import { TAGE, type Rezept, type Tag, type Wochenplan } from './typen'
import { tagDatum } from './woche'

const SALBEI = '2'

export interface KalenderTermin {
  tag: Tag
  datum: string
  titel: string
}

function isoDatum(datum: Date): string {
  const monat = String(datum.getMonth() + 1).padStart(2, '0')
  const tag = String(datum.getDate()).padStart(2, '0')
  return `${datum.getFullYear()}-${monat}-${tag}`
}

/** Ein Termin pro Abend, an dem gekocht wird. Mehrere Rezepte teilen sich den Termin. */
export function kalenderTermine(plan: Wochenplan, rezepte: Map<string, Rezept>, wocheId: string): KalenderTermin[] {
  return TAGE.flatMap((tag) => {
    const kochen = plan.kocheintraege.filter((e) => e.kochSlot === `${tag}-abend`)
    if (kochen.length === 0) return []
    const namen = kochen.map((e) => rezepte.get(e.rezeptId)?.name ?? e.rezeptName)
    return [{ tag, datum: isoDatum(tagDatum(wocheId, tag)), titel: `Kochen: ${[...new Set(namen)].join(', ')}` }]
  })
}

// Feste IDs pro Abend: So entstehen keine Duplikate, und die App muss sich keine Termine merken.
// Google erlaubt in IDs nur die Zeichen a-v und 0-9, deshalb 'k' statt 'W'.
export function terminId(wocheId: string, tag: Tag): string {
  return `mealprep${wocheId.replace('-W', 'k')}${tag}`
}

export function terminDaten(termin: KalenderTermin) {
  return {
    summary: termin.titel,
    colorId: SALBEI,
    status: 'confirmed',
    start: { dateTime: `${termin.datum}T19:00:00`, timeZone: 'Europe/Berlin' },
    end: { dateTime: `${termin.datum}T20:00:00`, timeZone: 'Europe/Berlin' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
  }
}
