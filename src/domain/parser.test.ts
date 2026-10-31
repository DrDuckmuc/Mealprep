import { describe, expect, it } from 'vitest'
import { parseRezepttext, parseZutat, parseZutaten } from './parser'

describe('parseZutat', () => {
  it.each([
    ['200 g Nudeln', 200, 'g', 'Nudeln'],
    ['200g Nudeln', 200, 'g', 'Nudeln'],
    ['1 EL Olivenöl', 1, 'EL', 'Olivenöl'],
    ['2 Zwiebeln', 2, '', 'Zwiebeln'],
    ['1/2 Bund Petersilie', 0.5, 'Bund', 'Petersilie'],
    ['½ Bund Petersilie', 0.5, 'Bund', 'Petersilie'],
    ['1½ TL Salz', 1.5, 'TL', 'Salz'],
    ['1 1/2 EL Zucker', 1.5, 'EL', 'Zucker'],
    ['1,5 kg Kartoffeln', 1.5, 'kg', 'Kartoffeln'],
    ['1.5 l Milch', 1.5, 'l', 'Milch'],
    ['2 Liter Wasser', 2, 'l', 'Wasser'],
    ['2-3 Tomaten', 3, '', 'Tomaten'],
    ['2 bis 3 Tomaten', 3, '', 'Tomaten'],
    ['ca. 100 g Mehl', 100, 'g', 'Mehl'],
    ['- 200 g Reis', 200, 'g', 'Reis'],
    ['• 1 Dose Tomaten (400 g)', 1, 'Dose', 'Tomaten (400 g)'],
    ['2 große Zwiebeln', 2, '', 'Zwiebeln'],
    ['1 Pck. Backpulver', 1, 'Packung', 'Backpulver'],
    ['2 Stück Ingwer', 2, '', 'Ingwer'],
    ['eine Zwiebel', 1, '', 'Zwiebel'],
    ['Olivenöl 2 EL', 2, 'EL', 'Olivenöl'],
    ['Mehl: 200 g', 200, 'g', 'Mehl'],
  ])('%s', (zeile, menge, einheit, name) => {
    expect(parseZutat(zeile)).toMatchObject({ menge, einheit, name })
  })

  it('erkennt Zutaten ohne Menge', () => {
    expect(parseZutat('Salz')).toMatchObject({ menge: null, einheit: '', name: 'Salz' })
    expect(parseZutat('etwas Butter')).toMatchObject({ menge: null, name: 'Butter' })
  })

  it('verwechselt Wörter nicht mit Einheiten', () => {
    expect(parseZutat('2 grüne Paprika')).toMatchObject({ menge: 2, einheit: '', name: 'grüne Paprika' })
    expect(parseZutat('1 Ei')).toMatchObject({ menge: 1, einheit: '', name: 'Ei' })
  })

  it('rät die Kategorie', () => {
    expect(parseZutat('2 Zwiebeln')?.kategorie).toBe('Obst & Gemüse')
    expect(parseZutat('2 EL Tomatenmark')?.kategorie).toBe('Trockenware')
    expect(parseZutat('1 TL Paprikapulver')?.kategorie).toBe('Gewürze')
    expect(parseZutat('500 g Hackfleisch')?.kategorie).toBe('Fleisch/Fisch')
    expect(parseZutat('3 Eier')?.kategorie).toBe('Kühlregal')
    expect(parseZutat('1 Schraube')?.kategorie).toBe('Sonstiges')
  })

  it('ignoriert leere Zeilen', () => {
    expect(parseZutat('   ')).toBeNull()
  })
})

describe('parseZutaten', () => {
  it('überspringt Überschriften und leere Zeilen', () => {
    const zutaten = parseZutaten('Für den Teig:\n200 g Mehl\n\nZutaten\n1 Ei')
    expect(zutaten.map((z) => z.name)).toEqual(['Mehl', 'Ei'])
  })

  it('verbindet Menge und Name aus getrennten Zeilen', () => {
    const zutaten = parseZutaten('200 g\nNudeln\n1 EL\nÖl')
    expect(zutaten).toMatchObject([
      { menge: 200, einheit: 'g', name: 'Nudeln' },
      { menge: 1, einheit: 'EL', name: 'Öl' },
    ])
  })
})

describe('parseRezepttext', () => {
  it('trennt Zutaten, Zubereitung und Portionen', () => {
    const ergebnis = parseRezepttext('Pasta\nZutaten für 4 Portionen\n400 g Nudeln\nSalz\nZubereitung\nKochen.\nServieren.')
    expect(ergebnis.portionen).toBe(4)
    expect(ergebnis.zutaten.map((z) => z.name)).toEqual(['Nudeln', 'Salz'])
    expect(ergebnis.zubereitung).toBe('Kochen.\nServieren.')
  })

  it('behandelt Text ohne Überschriften als Zutatenliste', () => {
    const ergebnis = parseRezepttext('200 g Nudeln\n2 Zwiebeln')
    expect(ergebnis.zutaten).toHaveLength(2)
    expect(ergebnis.zubereitung).toBe('')
    expect(ergebnis.portionen).toBeNull()
  })
})
