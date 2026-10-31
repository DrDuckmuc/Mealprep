import { describe, expect, it } from 'vitest'
import type { EinkaufsPosten } from './aggregation'
import { listeAlsText, listenEintraege, nachKategorie } from './einkauf'

const posten = (menge: number | null): EinkaufsPosten => ({ key: 'nudel|g', name: 'Nudeln', menge, einheit: 'g', kategorie: 'Trockenware' })

describe('listenEintraege', () => {
  it('behält den Abhakstatus bei gleicher oder kleinerer Menge', () => {
    const daten = { abgehakt: { 'nudel|g': 500 }, manuell: {} }
    expect(listenEintraege([posten(500)], daten)[0].abgehakt).toBe(true)
    expect(listenEintraege([posten(300)], daten)[0].abgehakt).toBe(true)
  })

  it('zeigt bei gestiegenem Bedarf nur die Differenz als offen', () => {
    const [eintrag] = listenEintraege([posten(800)], { abgehakt: { 'nudel|g': 500 }, manuell: {} })
    expect(eintrag).toMatchObject({ abgehakt: false, mengeText: '300 g', hinweis: '500 g schon abgehakt', menge: 800 })
  })

  it('behält Einträge ohne Menge abgehakt', () => {
    expect(listenEintraege([posten(null)], { abgehakt: { 'nudel|g': null }, manuell: {} })[0].abgehakt).toBe(true)
  })

  it('ergänzt manuelle Einträge', () => {
    const manuell = { m1: { id: 'm1', text: 'Spülmittel', kategorie: 'Sonstiges' as const, abgehakt: true } }
    expect(listenEintraege([], { abgehakt: {}, manuell })[0]).toMatchObject({ name: 'Spülmittel', manuell: true, abgehakt: true })
  })
})

describe('listeAlsText', () => {
  it('listet nur offene Einträge nach Kategorie', () => {
    const eintraege = listenEintraege(
      [
        posten(500),
        { key: 'zwiebel|', name: 'Zwiebeln', menge: 3, einheit: '', kategorie: 'Obst & Gemüse' },
        { key: 'dill|Bund', name: 'Dill', menge: 1, einheit: 'Bund', kategorie: 'Obst & Gemüse' },
      ],
      {
        abgehakt: { 'zwiebel|': 3 },
        manuell: { m1: { id: 'm1', text: 'Spülmittel', kategorie: 'Sonstiges', abgehakt: false } },
      },
    )
    expect(listeAlsText('Einkauf KW 45', eintraege)).toBe(
      'Einkauf KW 45\n\nObst & Gemüse\n- 1 Bund Dill\n\nTrockenware\n- 500 g Nudeln\n\nSonstiges\n- Spülmittel',
    )
  })

  it('nennt bei gestiegenem Bedarf nur die fehlende Menge', () => {
    const eintraege = listenEintraege([posten(800)], { abgehakt: { 'nudel|g': 500 }, manuell: {} })
    expect(listeAlsText('Liste', eintraege)).toContain('- 300 g Nudeln')
  })
})

describe('nachKategorie', () => {
  it('gruppiert in fester Reihenfolge und lässt leere Gruppen weg', () => {
    const eintraege = listenEintraege(
      [
        { key: 'a', name: 'Salz', menge: null, einheit: '', kategorie: 'Gewürze' },
        { key: 'b', name: 'Zwiebeln', menge: 2, einheit: '', kategorie: 'Obst & Gemüse' },
      ],
      { abgehakt: {}, manuell: {} },
    )
    expect(nachKategorie(eintraege).map((g) => g.kategorie)).toEqual(['Obst & Gemüse', 'Gewürze'])
  })
})
