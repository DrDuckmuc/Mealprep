import { describe, expect, it } from 'vitest'
import {
  folgeMittag,
  haltbarkeitsWarnung,
  kocheintraegeAm,
  kocheintragLoeschen,
  kochenEintragen,
  leererPlan,
  planKopieren,
  reste,
  resteEintragen,
  slotLeeren,
  textEintragen,
  verplantePortionen,
  warnungImSlot,
} from './plan'
import type { Rezept } from './typen'

const rezept: Rezept = {
  id: 'r1',
  name: 'Curry',
  link: '',
  basisPortionen: 2,
  zutaten: [],
  zubereitung: '',
  kuehlschrankTage: 2,
  einfrierbar: true,
  notizen: '',
}

const gekocht = (portionen = 2) =>
  kochenEintragen(leererPlan(), { id: 'k1', rezept, slot: 'mo-abend', portionen, mitFolgeMittag: true })

describe('kochenEintragen', () => {
  it('belegt Abend und nächsten Mittag', () => {
    const plan = gekocht()
    expect(plan.slots['mo-abend']).toEqual({ art: 'kochen', kochId: 'k1' })
    expect(plan.slots['di-mittag']).toEqual({ art: 'kochen', kochId: 'k1' })
  })

  it('kocht am Sonntag für Montagmittag', () => {
    expect(folgeMittag('so-abend')).toBe('mo-mittag')
  })

  it('hat freitags und samstags keinen Folge-Slot', () => {
    expect(folgeMittag('fr-abend')).toBeNull()
    expect(folgeMittag('sa-abend')).toBeNull()
  })

  it('erlaubt am Wochenende mehrere Kocheinträge pro Tag', () => {
    let plan = kochenEintragen(leererPlan(), { id: 'k1', rezept, slot: 'sa-abend', portionen: 4, mitFolgeMittag: false })
    plan = kochenEintragen(plan, { id: 'k2', rezept, slot: 'sa-abend', portionen: 2, mitFolgeMittag: false })
    plan = kochenEintragen(plan, { id: 'k3', rezept, slot: 'so-abend', portionen: 2, mitFolgeMittag: true })
    expect(kocheintraegeAm(plan, 'sa').map((e) => e.id)).toEqual(['k1', 'k2'])
    expect(plan.slots['sa-abend']).toBeUndefined()
    expect(plan.slots['mo-mittag']).toEqual({ art: 'kochen', kochId: 'k3' })
  })

  it('zählt Vorgekochtes als frei und warnt bei langer Lagerung', () => {
    const plan = kochenEintragen(leererPlan(), { id: 'k1', rezept, slot: 'sa-abend', portionen: 4, mitFolgeMittag: false })
    expect(reste(plan, 'mo-mittag')).toHaveLength(1)
    const verplant = resteEintragen(plan, 'mi-abend', 'k1')
    expect(verplantePortionen(verplant, 'k1')).toBe(1)
    expect(haltbarkeitsWarnung(verplant, verplant.kocheintraege[0], rezept)).toContain('nach 4 Tagen')
  })

  it('löscht einen Vorkoch-Eintrag samt verplanter Portionen', () => {
    let plan = kochenEintragen(leererPlan(), { id: 'k1', rezept, slot: 'sa-abend', portionen: 4, mitFolgeMittag: false })
    plan = resteEintragen(plan, 'mo-mittag', 'k1')
    expect(kocheintragLoeschen(plan, 'k1')).toEqual(leererPlan())
  })

  it('überschreibt einen belegten Mittag nicht', () => {
    const plan = textEintragen(leererPlan(), 'di-mittag', 'auswärts')
    const neu = kochenEintragen(plan, { id: 'k1', rezept, slot: 'mo-abend', portionen: 2, mitFolgeMittag: true })
    expect(neu.slots['di-mittag']).toEqual({ art: 'text', text: 'auswärts' })
  })
})

describe('slotLeeren', () => {
  it('entfernt im Koch-Slot den ganzen Eintrag', () => {
    const plan = slotLeeren(gekocht(), 'mo-abend')
    expect(plan.kocheintraege).toEqual([])
    expect(plan.slots).toEqual({})
  })

  it('entfernt im Reste-Slot nur diesen Slot', () => {
    const plan = slotLeeren(gekocht(), 'di-mittag')
    expect(plan.kocheintraege).toHaveLength(1)
    expect(plan.slots['mo-abend']).toBeDefined()
    expect(plan.slots['di-mittag']).toBeUndefined()
  })
})

describe('reste', () => {
  it('bietet nur frühere Einträge mit freien Portionen an', () => {
    expect(reste(gekocht(2), 'mi-mittag')).toEqual([])
    expect(reste(gekocht(4), 'mi-mittag')).toHaveLength(1)
    expect(reste(gekocht(4), 'mo-mittag')).toEqual([])
  })

  it('zählt verplante Portionen', () => {
    const plan = resteEintragen(gekocht(4), 'mi-mittag', 'k1')
    expect(verplantePortionen(plan, 'k1')).toBe(3)
  })
})

describe('haltbarkeitsWarnung', () => {
  const eintrag = gekocht(4).kocheintraege[0]

  it('schweigt, solange die Haltbarkeit reicht', () => {
    expect(haltbarkeitsWarnung(gekocht(4), eintrag, rezept)).toBeNull()
    const plan = resteEintragen(gekocht(4), 'mi-mittag', 'k1')
    expect(haltbarkeitsWarnung(plan, eintrag, rezept)).toBeNull()
  })

  it('rät zum Einfrieren', () => {
    const plan = resteEintragen(gekocht(4), 'do-mittag', 'k1')
    expect(haltbarkeitsWarnung(plan, eintrag, rezept)).toBe('Hält 2 Tage, letzte Portion nach 3 Tagen: einfrieren')
  })

  it('warnt, wenn Einfrieren nicht geht', () => {
    const plan = resteEintragen(gekocht(4), 'do-mittag', 'k1')
    expect(haltbarkeitsWarnung(plan, eintrag, { ...rezept, einfrierbar: false })).toContain('nicht einfrierbar')
  })

  it('ignoriert Rezepte ohne Haltbarkeitsangabe', () => {
    const plan = resteEintragen(gekocht(4), 'do-mittag', 'k1')
    expect(haltbarkeitsWarnung(plan, eintrag, { ...rezept, kuehlschrankTage: null })).toBeNull()
  })
})

describe('warnungImSlot', () => {
  const eintrag = gekocht(4).kocheintraege[0]

  it('zeigt die Warnung am Kochtag und an zu späten Slots', () => {
    expect(warnungImSlot(eintrag, 'mo-abend', rezept)).toBe(true)
    expect(warnungImSlot(eintrag, 'di-mittag', rezept)).toBe(false)
    expect(warnungImSlot(eintrag, 'do-mittag', rezept)).toBe(true)
  })
})

describe('planKopieren', () => {
  it('übernimmt Slots mit neuen IDs', () => {
    const vorlage = textEintragen(gekocht(), 'fr-abend', 'auswärts')
    const kopie = planKopieren(vorlage, () => 'neu')
    expect(kopie.kocheintraege[0].id).toBe('neu')
    expect(kopie.slots['mo-abend']).toEqual({ art: 'kochen', kochId: 'neu' })
    expect(kopie.slots['di-mittag']).toEqual({ art: 'kochen', kochId: 'neu' })
    expect(kopie.slots['fr-abend']).toEqual({ art: 'text', text: 'auswärts' })
  })
})
