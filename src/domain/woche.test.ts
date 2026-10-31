import { describe, expect, it } from 'vitest'
import { isoWoche, planungsWoche, tagDatum, wocheLabel, wocheVerschieben } from './woche'

describe('isoWoche', () => {
  it('berechnet normale Wochen', () => {
    expect(isoWoche(new Date(2026, 9, 31))).toBe('2026-W44')
    expect(isoWoche(new Date(2026, 10, 2))).toBe('2026-W45')
  })

  it('ordnet den Jahreswechsel dem Jahr des Donnerstags zu', () => {
    expect(isoWoche(new Date(2027, 0, 1))).toBe('2026-W53')
    expect(isoWoche(new Date(2024, 11, 30))).toBe('2025-W01')
  })
})

describe('wocheVerschieben', () => {
  it('blättert über den Jahreswechsel', () => {
    expect(wocheVerschieben('2026-W53', 1)).toBe('2027-W01')
    expect(wocheVerschieben('2027-W01', -1)).toBe('2026-W53')
  })
})

describe('planungsWoche', () => {
  it('nimmt am Wochenende die nächste Woche', () => {
    expect(planungsWoche(new Date(2026, 9, 31))).toBe('2026-W45')
    expect(planungsWoche(new Date(2026, 10, 1))).toBe('2026-W45')
  })

  it('bleibt unter der Woche in der aktuellen Woche', () => {
    expect(planungsWoche(new Date(2026, 10, 2))).toBe('2026-W45')
    expect(planungsWoche(new Date(2026, 10, 6))).toBe('2026-W45')
  })
})

describe('Datumsanzeige', () => {
  it('liefert das Wochenende vor dem Montag', () => {
    expect(tagDatum('2026-W45', 'sa')).toEqual(new Date(2026, 9, 31))
    expect(tagDatum('2026-W45', 'so')).toEqual(new Date(2026, 10, 1))
    expect(tagDatum('2026-W45', 'fr')).toEqual(new Date(2026, 10, 6))
  })

  it('beschriftet die Woche', () => {
    expect(wocheLabel('2026-W45')).toBe('KW 45 · 2.11. – 6.11.')
  })
})
