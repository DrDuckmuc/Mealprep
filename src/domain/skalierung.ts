import type { Zutat } from './typen'

export function skaliereZutaten(zutaten: Zutat[], basisPortionen: number, portionen: number): Zutat[] {
  const faktor = basisPortionen > 0 ? portionen / basisPortionen : 1
  return zutaten.map((z) => (z.menge === null ? z : { ...z, menge: z.menge * faktor }))
}
