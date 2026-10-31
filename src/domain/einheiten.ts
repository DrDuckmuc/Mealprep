const ALIASE: Record<string, string[]> = {
  mg: ['mg', 'milligramm'],
  g: ['g', 'gr', 'gramm'],
  kg: ['kg', 'kilo', 'kilogramm'],
  ml: ['ml', 'milliliter'],
  cl: ['cl', 'zentiliter'],
  dl: ['dl', 'deziliter'],
  l: ['l', 'liter'],
  EL: ['el', 'essl', 'esslöffel'],
  TL: ['tl', 'teel', 'teelöffel'],
  // Leere Einheit bedeutet Stückzahl: "2 Stück Ingwer" und "2 Ingwer" sind dasselbe.
  '': ['stk', 'stück', 'stücke'],
  Bund: ['bund', 'bd', 'bunde'],
  Prise: ['prise', 'prisen'],
  Msp: ['msp', 'messerspitze', 'messerspitzen'],
  Dose: ['dose', 'dosen'],
  Packung: ['packung', 'packungen', 'pck', 'pkg', 'pack', 'päckchen', 'pkt', 'paket', 'pakete'],
  Glas: ['glas', 'gläser'],
  Becher: ['becher'],
  Beutel: ['beutel'],
  Flasche: ['flasche', 'flaschen'],
  Tasse: ['tasse', 'tassen'],
  Zehe: ['zehe', 'zehen'],
  Scheibe: ['scheibe', 'scheiben'],
  Stange: ['stange', 'stangen'],
  Zweig: ['zweig', 'zweige'],
  Kopf: ['kopf', 'köpfe'],
  Knolle: ['knolle', 'knollen'],
  Blatt: ['blatt', 'blätter'],
  Handvoll: ['handvoll', 'hand voll'],
  Schuss: ['schuss'],
  Spritzer: ['spritzer'],
}

const EINHEIT_VON_ALIAS = new Map(
  Object.entries(ALIASE).flatMap(([einheit, aliase]) => aliase.map((a) => [a, einheit] as const)),
)

/** Liefert die normierte Einheit oder undefined, wenn das Wort keine Einheit ist. */
export function normalisiereEinheit(wort: string): string | undefined {
  return EINHEIT_VON_ALIAS.get(wort.toLowerCase().replace(/\.$/, ''))
}

const UMRECHNUNG: Record<string, { basis: string; faktor: number }> = {
  mg: { basis: 'g', faktor: 0.001 },
  g: { basis: 'g', faktor: 1 },
  kg: { basis: 'g', faktor: 1000 },
  ml: { basis: 'ml', faktor: 1 },
  cl: { basis: 'ml', faktor: 10 },
  dl: { basis: 'ml', faktor: 100 },
  l: { basis: 'ml', faktor: 1000 },
}

export function zuBasisEinheit(menge: number, einheit: string): { menge: number; einheit: string } {
  const umrechnung = UMRECHNUNG[einheit]
  return umrechnung ? { menge: menge * umrechnung.faktor, einheit: umrechnung.basis } : { menge, einheit }
}

// Diese Einheiten gibt es im Laden nur ganz: aus 1,5 Zwiebeln werden beim Einkauf 2.
const NUR_GANZ = new Set(['', 'Bund', 'Dose', 'Packung', 'Glas', 'Becher', 'Beutel', 'Flasche', 'Zehe', 'Stange', 'Zweig', 'Kopf', 'Knolle'])

export function kaufMenge(menge: number, einheit: string): number {
  const gerundet = Math.round(menge * 1000) / 1000
  return NUR_GANZ.has(einheit) ? Math.ceil(gerundet) : gerundet
}

export function formatZahl(zahl: number): string {
  return zahl.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

export function formatMenge(menge: number | null, einheit: string): string {
  if (menge === null) return ''
  if (einheit === 'g' && menge >= 1000) return `${formatZahl(menge / 1000)} kg`
  if (einheit === 'ml' && menge >= 1000) return `${formatZahl(menge / 1000)} l`
  return einheit ? `${formatZahl(menge)} ${einheit}` : formatZahl(menge)
}
