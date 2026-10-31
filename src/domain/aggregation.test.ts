import { describe, expect, it } from 'vitest'
import { aggregiere, bedarfAusPlan, istVorrat, namenSchluessel } from './aggregation'
import { formatMenge } from './einheiten'
import { kochenEintragen, leererPlan } from './plan'
import type { Rezept, Zutat } from './typen'

const zutat = (menge: number | null, einheit: string, name: string): Zutat => ({ menge, einheit, name, kategorie: 'Sonstiges' })

describe('aggregiere', () => {
  it('fasst gleiche Zutaten zusammen und normalisiert g/kg', () => {
    const [posten] = aggregiere([zutat(800, 'g', 'Mehl'), zutat(0.5, 'kg', 'Mehl')])
    expect(posten).toMatchObject({ menge: 1300, einheit: 'g' })
    expect(formatMenge(posten.menge, posten.einheit)).toBe('1,3 kg')
  })

  it('normalisiert ml/l/cl', () => {
    const [posten] = aggregiere([zutat(1, 'l', 'Milch'), zutat(250, 'ml', 'Milch'), zutat(5, 'cl', 'Milch')])
    expect(formatMenge(posten.menge, posten.einheit)).toBe('1,3 l')
  })

  it('erkennt Singular, Plural und Zusätze als gleiche Zutat', () => {
    const posten = aggregiere([zutat(1, '', 'Zwiebel'), zutat(2, '', 'Zwiebeln, gewürfelt'), zutat(1, '', 'zwiebeln')])
    expect(posten).toHaveLength(1)
    expect(posten[0].menge).toBe(4)
  })

  it('hält unvereinbare Einheiten getrennt', () => {
    expect(aggregiere([zutat(1, 'Bund', 'Petersilie'), zutat(20, 'g', 'Petersilie')])).toHaveLength(2)
  })

  it('rundet nur stückweise Kaufbares auf', () => {
    expect(aggregiere([zutat(1.5, '', 'Zwiebeln')])[0].menge).toBe(2)
    expect(aggregiere([zutat(0.5, 'Bund', 'Dill')])[0].menge).toBe(1)
    expect(aggregiere([zutat(1.5, 'EL', 'Öl')])[0].menge).toBe(1.5)
    expect(aggregiere([zutat(1 / 3, '', 'Zitronen'), zutat(1 / 3, '', 'Zitronen'), zutat(1 / 3, '', 'Zitronen')])[0].menge).toBe(1)
  })

  it('kombiniert Einträge mit und ohne Menge', () => {
    expect(aggregiere([zutat(null, '', 'Zwiebeln'), zutat(2, '', 'Zwiebeln')])[0].menge).toBe(2)
    expect(aggregiere([zutat(null, '', 'Salz'), zutat(null, '', 'Salz')])[0].menge).toBeNull()
  })
})

describe('namenSchluessel', () => {
  it('normalisiert Sonderformen', () => {
    expect(namenSchluessel('Eier')).toBe(namenSchluessel('Ei'))
    expect(namenSchluessel('Äpfel')).toBe(namenSchluessel('Apfel'))
    expect(namenSchluessel('Tomaten (reif)')).toBe('tomate')
  })
})

describe('istVorrat', () => {
  it('trifft exakt, aufs letzte Wort und auf Wortenden', () => {
    expect(istVorrat('Salz', ['Salz'])).toBe(true)
    expect(istVorrat('schwarzer Pfeffer', ['Pfeffer'])).toBe(true)
    expect(istVorrat('Olivenöl', ['Öl'])).toBe(true)
  })

  it('trifft keine fremden Wörter', () => {
    expect(istVorrat('Reis', ['Eis'])).toBe(false)
    expect(istVorrat('Brei', ['Eier'])).toBe(false)
    expect(istVorrat('Salzbrezel', ['Salz'])).toBe(false)
  })
})

describe('bedarfAusPlan', () => {
  const rezept: Rezept = {
    id: 'r1',
    name: 'Pasta',
    link: '',
    basisPortionen: 4,
    zutaten: [zutat(400, 'g', 'Nudeln'), zutat(2, 'EL', 'Olivenöl'), zutat(null, '', 'Salz')],
    zubereitung: '',
    kuehlschrankTage: 3,
    einfrierbar: true,
    notizen: '',
  }
  const rezepte = new Map([[rezept.id, rezept]])

  it('skaliert, summiert und filtert den Vorrat', () => {
    let plan = kochenEintragen(leererPlan(), { id: 'k1', rezept, slot: 'mo-abend', portionen: 2, mitFolgeMittag: true })
    plan = kochenEintragen(plan, { id: 'k2', rezept, slot: 'mi-abend', portionen: 2, mitFolgeMittag: true })
    const bedarf = bedarfAusPlan(plan, rezepte, ['Salz', 'Öl'])
    expect(bedarf.posten).toHaveLength(1)
    expect(bedarf.posten[0]).toMatchObject({ name: 'Nudeln', menge: 400, einheit: 'g' })
    expect(bedarf.ausVorrat).toEqual(['Olivenöl', 'Salz'])
  })

  it('überspringt gelöschte Rezepte', () => {
    const plan = kochenEintragen(leererPlan(), { id: 'k1', rezept, slot: 'mo-abend', portionen: 2, mitFolgeMittag: true })
    expect(bedarfAusPlan(plan, new Map(), []).posten).toEqual([])
  })
})
