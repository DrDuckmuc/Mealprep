import { describe, expect, it } from 'vitest'
import { skaliereZutaten } from './skalierung'
import type { Zutat } from './typen'

const nudeln: Zutat = { menge: 400, einheit: 'g', name: 'Nudeln', kategorie: 'Trockenware' }
const salz: Zutat = { menge: null, einheit: '', name: 'Salz', kategorie: 'Gewürze' }

describe('skaliereZutaten', () => {
  it('rechnet von Basis- auf geplante Portionen um', () => {
    expect(skaliereZutaten([nudeln], 4, 2)[0].menge).toBe(200)
    expect(skaliereZutaten([nudeln], 2, 3)[0].menge).toBe(600)
  })

  it('lässt Zutaten ohne Menge unverändert', () => {
    expect(skaliereZutaten([salz], 4, 2)[0]).toEqual(salz)
  })

  it('verändert die Vorlage nicht', () => {
    skaliereZutaten([nudeln], 4, 2)
    expect(nudeln.menge).toBe(400)
  })

  it('fängt ungültige Basisportionen ab', () => {
    expect(skaliereZutaten([nudeln], 0, 2)[0].menge).toBe(400)
  })
})
