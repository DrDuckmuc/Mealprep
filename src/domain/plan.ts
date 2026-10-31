import { TAGE, type Kocheintrag, type Rezept, type SlotId, type SlotInhalt, type Tag, type Wochenplan } from './typen'

// Chronologisch. Der Sonntag vor der Woche hat nur einen Abend-Slot.
export const SLOTS: SlotId[] = TAGE.flatMap((tag): SlotId[] =>
  tag === 'so' ? ['so-abend'] : [`${tag}-mittag`, `${tag}-abend`],
)

export const TAG_NAMEN: Record<Tag, string> = { so: 'Sonntag', mo: 'Montag', di: 'Dienstag', mi: 'Mittwoch', do: 'Donnerstag', fr: 'Freitag' }

export function slotTag(slot: SlotId): Tag {
  return slot.split('-')[0] as Tag
}

export function slotLabel(slot: SlotId): string {
  const [tag, mahlzeit] = slot.split('-')
  const kurz = tag.charAt(0).toUpperCase() + tag.slice(1)
  return `${kurz} ${mahlzeit === 'abend' ? 'Abend' : 'Mittag'}`
}

export function leererPlan(): Wochenplan {
  return { kocheintraege: [], slots: {} }
}

export function istLeer(plan: Wochenplan): boolean {
  return plan.kocheintraege.length === 0 && Object.keys(plan.slots).length === 0
}

/** Der Mittag nach einem Abend; freitags gibt es keinen Slot mehr. */
export function folgeMittag(slot: SlotId): SlotId | null {
  if (!slot.endsWith('-abend')) return null
  const folge = TAGE[TAGE.indexOf(slotTag(slot)) + 1]
  return folge ? `${folge}-mittag` : null
}

export function findeEintrag(plan: Wochenplan, kochId: string): Kocheintrag | undefined {
  return plan.kocheintraege.find((e) => e.id === kochId)
}

function slotsVon(plan: Wochenplan, kochId: string): SlotId[] {
  return SLOTS.filter((slot) => {
    const inhalt = plan.slots[slot]
    return inhalt?.art === 'kochen' && inhalt.kochId === kochId
  })
}

function mitSlot(plan: Wochenplan, slot: SlotId, inhalt: SlotInhalt): Wochenplan {
  return { ...plan, slots: { ...plan.slots, [slot]: inhalt } }
}

interface KochenOptionen {
  id: string
  rezept: Pick<Rezept, 'id' | 'name'>
  slot: SlotId
  portionen: number
  // Füllt zusätzlich den nächsten Mittag; ein belegter Slot wird nicht überschrieben.
  mitFolgeMittag: boolean
}

export function kochenEintragen(plan: Wochenplan, { id, rezept, slot, portionen, mitFolgeMittag }: KochenOptionen): Wochenplan {
  const eintrag: Kocheintrag = { id, rezeptId: rezept.id, rezeptName: rezept.name, kochSlot: slot, portionen }
  const inhalt: SlotInhalt = { art: 'kochen', kochId: id }
  let neu = mitSlot({ ...plan, kocheintraege: [...plan.kocheintraege, eintrag] }, slot, inhalt)
  const folge = mitFolgeMittag ? folgeMittag(slot) : null
  if (folge && !plan.slots[folge]) neu = mitSlot(neu, folge, inhalt)
  return neu
}

export function resteEintragen(plan: Wochenplan, slot: SlotId, kochId: string): Wochenplan {
  return mitSlot(plan, slot, { art: 'kochen', kochId })
}

export function textEintragen(plan: Wochenplan, slot: SlotId, text: string): Wochenplan {
  return mitSlot(plan, slot, { art: 'text', text })
}

/** Leert einen Slot. Im Koch-Slot verschwindet der ganze Kocheintrag samt Resten. */
export function slotLeeren(plan: Wochenplan, slot: SlotId): Wochenplan {
  const inhalt = plan.slots[slot]
  const eintrag = inhalt?.art === 'kochen' ? findeEintrag(plan, inhalt.kochId) : undefined
  const slots = { ...plan.slots }
  delete slots[slot]
  if (!eintrag || eintrag.kochSlot !== slot) return { ...plan, slots }

  for (const verknuepft of slotsVon(plan, eintrag.id)) delete slots[verknuepft]
  return { kocheintraege: plan.kocheintraege.filter((e) => e.id !== eintrag.id), slots }
}

export function portionenSetzen(plan: Wochenplan, kochId: string, portionen: number): Wochenplan {
  return {
    ...plan,
    kocheintraege: plan.kocheintraege.map((e) => (e.id === kochId ? { ...e, portionen } : e)),
  }
}

export function verplantePortionen(plan: Wochenplan, kochId: string): number {
  return slotsVon(plan, kochId).length
}

/** Kocheinträge vor dem Slot, von denen noch Portionen übrig sind. */
export function reste(plan: Wochenplan, slot: SlotId): Kocheintrag[] {
  const position = SLOTS.indexOf(slot)
  return plan.kocheintraege.filter(
    (e) => SLOTS.indexOf(e.kochSlot) < position && e.portionen > verplantePortionen(plan, e.id),
  )
}

export function tageBisLetzteMahlzeit(plan: Wochenplan, eintrag: Kocheintrag): number {
  const letzter = slotsVon(plan, eintrag.id).at(-1) ?? eintrag.kochSlot
  return TAGE.indexOf(slotTag(letzter)) - TAGE.indexOf(slotTag(eintrag.kochSlot))
}

export function haltbarkeitsWarnung(plan: Wochenplan, eintrag: Kocheintrag, rezept: Rezept | undefined): string | null {
  if (!rezept || rezept.kuehlschrankTage === null) return null
  const tage = tageBisLetzteMahlzeit(plan, eintrag)
  const haelt = rezept.kuehlschrankTage
  if (tage <= haelt) return null
  const dauer = `Hält ${haelt === 1 ? '1 Tag' : `${haelt} Tage`}, letzte Portion nach ${tage === 1 ? '1 Tag' : `${tage} Tagen`}`
  return rezept.einfrierbar ? `${dauer}: einfrieren` : `${dauer}: nicht einfrierbar`
}

/** Die Warnung gehört an den Kochtag (dort fällt die Entscheidung) und an zu späte Portionen. */
export function warnungImSlot(eintrag: Kocheintrag, slot: SlotId, rezept: Rezept | undefined): boolean {
  if (slot === eintrag.kochSlot) return true
  const tage = TAGE.indexOf(slotTag(slot)) - TAGE.indexOf(slotTag(eintrag.kochSlot))
  return rezept?.kuehlschrankTage != null && tage > rezept.kuehlschrankTage
}

/** Vorlage für eine neue Woche: gleiche Slots, neue Kocheintrag-IDs. */
export function planKopieren(vorlage: Wochenplan, neueId: () => string): Wochenplan {
  const ids = new Map(vorlage.kocheintraege.map((e) => [e.id, neueId()]))
  const slots: Wochenplan['slots'] = {}
  for (const slot of SLOTS) {
    const inhalt = vorlage.slots[slot]
    if (inhalt) slots[slot] = inhalt.art === 'kochen' ? { art: 'kochen', kochId: ids.get(inhalt.kochId)! } : inhalt
  }
  return {
    kocheintraege: vorlage.kocheintraege.map((e) => ({ ...e, id: ids.get(e.id)! })),
    slots,
  }
}
