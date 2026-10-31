import type { Tag } from './typen'

const TAG_MS = 86_400_000
const TAG_OFFSET: Record<Tag, number> = { so: -1, mo: 0, di: 1, mi: 2, do: 3, fr: 4 }

function ersterDonnerstag(jahr: number): number {
  const jan4 = Date.UTC(jahr, 0, 4)
  const wochentag = (new Date(jan4).getUTCDay() + 6) % 7
  return jan4 + (3 - wochentag) * TAG_MS
}

/** ISO-Kalenderwoche als Text, z. B. "2026-W45". Die Woche gehört zum Jahr ihres Donnerstags. */
export function isoWoche(datum: Date): string {
  const tag = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate())
  const wochentag = (new Date(tag).getUTCDay() + 6) % 7
  const donnerstag = tag + (3 - wochentag) * TAG_MS
  const jahr = new Date(donnerstag).getUTCFullYear()
  const nummer = 1 + Math.round((donnerstag - ersterDonnerstag(jahr)) / (7 * TAG_MS))
  return `${jahr}-W${String(nummer).padStart(2, '0')}`
}

function montagMs(wocheId: string): number {
  const [jahr, nummer] = wocheId.split('-W').map(Number)
  return ersterDonnerstag(jahr) + (nummer - 1) * 7 * TAG_MS - 3 * TAG_MS
}

function alsLokalesDatum(ms: number): Date {
  const utc = new Date(ms)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

export function wocheVerschieben(wocheId: string, wochen: number): string {
  return isoWoche(alsLokalesDatum(montagMs(wocheId) + wochen * 7 * TAG_MS))
}

/** Am Wochenende wird für die kommende Woche geplant und eingekauft. */
export function planungsWoche(heute: Date): string {
  const aktuelle = isoWoche(heute)
  const wochentag = heute.getDay()
  return wochentag === 6 || wochentag === 0 ? wocheVerschieben(aktuelle, 1) : aktuelle
}

export function tagDatum(wocheId: string, tag: Tag): Date {
  return alsLokalesDatum(montagMs(wocheId) + TAG_OFFSET[tag] * TAG_MS)
}

function kurzDatum(datum: Date): string {
  return `${datum.getDate()}.${datum.getMonth() + 1}.`
}

export function tagLabel(wocheId: string, tag: Tag): string {
  return kurzDatum(tagDatum(wocheId, tag))
}

export function wocheLabel(wocheId: string): string {
  const nummer = Number(wocheId.split('-W')[1])
  return `KW ${nummer} · ${kurzDatum(tagDatum(wocheId, 'mo'))} – ${kurzDatum(tagDatum(wocheId, 'fr'))}`
}
