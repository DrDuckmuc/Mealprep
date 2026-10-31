import { useState } from 'react'
import { useAppDaten } from '../data/AppDaten'
import {
  SLOTS,
  TAG_NAMEN,
  findeEintrag,
  haltbarkeitsWarnung,
  istLeer,
  planKopieren,
  slotLabel,
  slotTag,
  warnungImSlot,
} from '../domain/plan'
import { TAGE, type SlotId, type Tag } from '../domain/typen'
import { tagLabel, wocheVerschieben } from '../domain/woche'
import { PlusIcon, WarnIcon } from '../ui/Icons'
import { WochenKopf } from '../ui/WochenKopf'
import { SlotSheet } from './SlotSheet'

function SlotZeile({ slot, onOeffnen }: { slot: SlotId; onOeffnen: () => void }) {
  const { plan, rezepteNachId } = useAppDaten()
  const inhalt = plan.slots[slot]
  const mahlzeit = slot.endsWith('abend') ? 'Abend' : 'Mittag'

  if (!inhalt) {
    return (
      <button className="slot leer" onClick={onOeffnen} aria-label={`${slotLabel(slot)} belegen`}>
        <span className="slot-zeit">{mahlzeit}</span>
        <span className="slot-plus">
          <PlusIcon />
        </span>
      </button>
    )
  }

  if (inhalt.art === 'text') {
    return (
      <button className="slot" onClick={onOeffnen}>
        <span className="slot-zeit">{mahlzeit}</span>
        <span className="slot-inhalt kursiv">{inhalt.text}</span>
      </button>
    )
  }

  const eintrag = findeEintrag(plan, inhalt.kochId)
  if (!eintrag) return null
  const rezept = rezepteNachId.get(eintrag.rezeptId)
  const warnung = warnungImSlot(eintrag, slot, rezept) ? haltbarkeitsWarnung(plan, eintrag, rezept) : null
  const istKochSlot = eintrag.kochSlot === slot

  return (
    <button className={`slot ${istKochSlot ? 'kochen' : ''}`} onClick={onOeffnen}>
      <span className="slot-zeit">{mahlzeit}</span>
      <span className="slot-inhalt">
        <span className="slot-name">{rezept?.name ?? eintrag.rezeptName}</span>
        <span className="slot-info">
          {istKochSlot ? `Kochen · ${eintrag.portionen} Portionen` : `Vorgekocht · ${slotLabel(eintrag.kochSlot)}`}
        </span>
        {warnung && (
          <span className="warnung">
            <WarnIcon /> {warnung}
          </span>
        )}
      </span>
    </button>
  )
}

function TagKarte({ tag, onSlot }: { tag: Tag; onSlot: (slot: SlotId) => void }) {
  const { wocheId } = useAppDaten()
  const slots = SLOTS.filter((slot) => slotTag(slot) === tag)
  return (
    <section className="tag-karte">
      <h2>
        {TAG_NAMEN[tag]} <span className="gedaempft">{tagLabel(wocheId, tag)}</span>
      </h2>
      {slots.map((slot) => (
        <SlotZeile key={slot} slot={slot} onOeffnen={() => onSlot(slot)} />
      ))}
    </section>
  )
}

export function Woche() {
  const { plan, planAendern, speicher, wocheId, geladen, fehlerMelden } = useAppDaten()
  const [offenerSlot, setOffenerSlot] = useState<SlotId | null>(null)
  const [hinweis, setHinweis] = useState('')

  async function vorwocheKopieren() {
    const vorwoche = wocheVerschieben(wocheId, -1)
    try {
      const vorlage = await speicher.wocheLesen(vorwoche)
      if (!vorlage || istLeer(vorlage)) {
        setHinweis('Die Vorwoche ist leer.')
        return
      }
      if (!istLeer(plan) && !confirm('Diese Woche ist schon belegt. Mit der Vorwoche überschreiben?')) return
      setHinweis('')
      planAendern(() => planKopieren(vorlage, speicher.neueId))
    } catch (e) {
      fehlerMelden(e)
    }
  }

  return (
    <main>
      <WochenKopf />
      {!geladen ? (
        <p className="gedaempft mitte">Lädt …</p>
      ) : (
        <>
          {TAGE.map((tag) => (
            <TagKarte key={tag} tag={tag} onSlot={setOffenerSlot} />
          ))}
          <button className="knopf breit" onClick={vorwocheKopieren}>
            Vorwoche als Vorlage kopieren
          </button>
          {hinweis && <p className="gedaempft mitte">{hinweis}</p>}
        </>
      )}
      {offenerSlot && <SlotSheet key={offenerSlot} slot={offenerSlot} onSchliessen={() => setOffenerSlot(null)} />}
    </main>
  )
}
