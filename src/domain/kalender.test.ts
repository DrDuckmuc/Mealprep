import { describe, expect, it } from 'vitest'
import { kalenderTermine, terminDaten, terminId } from './kalender'
import { kochenEintragen, leererPlan, resteEintragen, textEintragen } from './plan'
import { TAGE, type Rezept } from './typen'

const rezept = (id: string, name: string): Rezept => ({
  id,
  name,
  link: '',
  basisPortionen: 2,
  zutaten: [],
  zubereitung: '',
  kuehlschrankTage: 3,
  einfrierbar: true,
  notizen: '',
})

const curry = rezept('r1', 'Curry')
const chili = rezept('r2', 'Chili')
const rezepte = new Map([curry, chili].map((r) => [r.id, r]))

describe('kalenderTermine', () => {
  it('erzeugt nur für gekochte Abende einen Termin', () => {
    let plan = kochenEintragen(leererPlan(), { id: 'k1', rezept: curry, slot: 'mo-abend', portionen: 4, mitFolgeMittag: true })
    plan = resteEintragen(plan, 'mi-abend', 'k1')
    plan = textEintragen(plan, 'do-abend', 'auswärts')
    plan = kochenEintragen(plan, { id: 'k2', rezept: chili, slot: 'fr-mittag', portionen: 1, mitFolgeMittag: false })
    expect(kalenderTermine(plan, rezepte, '2026-W45')).toEqual([{ tag: 'mo', datum: '2026-11-02', titel: 'Kochen: Curry' }])
  })

  it('fasst mehrere Rezepte eines Abends zusammen', () => {
    let plan = kochenEintragen(leererPlan(), { id: 'k1', rezept: curry, slot: 'sa-abend', portionen: 4, mitFolgeMittag: false })
    plan = kochenEintragen(plan, { id: 'k2', rezept: chili, slot: 'sa-abend', portionen: 4, mitFolgeMittag: false })
    expect(kalenderTermine(plan, rezepte, '2026-W45')).toEqual([{ tag: 'sa', datum: '2026-10-31', titel: 'Kochen: Curry, Chili' }])
  })

  it('nutzt für gelöschte Rezepte den gespeicherten Namen', () => {
    const plan = kochenEintragen(leererPlan(), { id: 'k1', rezept: curry, slot: 'mo-abend', portionen: 2, mitFolgeMittag: false })
    expect(kalenderTermine(plan, new Map(), '2026-W45')[0].titel).toBe('Kochen: Curry')
  })

  it('liefert für eine leere Woche nichts', () => {
    expect(kalenderTermine(leererPlan(), rezepte, '2026-W45')).toEqual([])
  })
})

describe('terminId', () => {
  it('nutzt nur von Google erlaubte Zeichen und ist eindeutig', () => {
    const ids = TAGE.map((tag) => terminId('2026-W45', tag))
    for (const id of ids) expect(id).toMatch(/^[a-v0-9]{5,1024}$/)
    expect(new Set(ids).size).toBe(TAGE.length)
    expect(terminId('2026-W46', 'mo')).not.toBe(terminId('2026-W45', 'mo'))
  })
})

describe('terminDaten', () => {
  it('legt 19 bis 20 Uhr in Salbei mit Erinnerung 30 Minuten vorher an', () => {
    expect(terminDaten({ tag: 'mo', datum: '2026-11-02', titel: 'Kochen: Curry' })).toEqual({
      summary: 'Kochen: Curry',
      colorId: '2',
      status: 'confirmed',
      start: { dateTime: '2026-11-02T19:00:00', timeZone: 'Europe/Berlin' },
      end: { dateTime: '2026-11-02T20:00:00', timeZone: 'Europe/Berlin' },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
    })
  })
})
