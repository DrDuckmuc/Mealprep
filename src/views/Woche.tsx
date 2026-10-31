import { useState } from 'react'
import type { User } from 'firebase/auth'
import { useAppDaten } from '../data/AppDaten'
import { kalenderAbgleichen, kalenderFehlerText } from '../data/kalender'
import { kalenderTermine } from '../domain/kalender'
import {
  SLOTS,
  TAG_NAMEN,
  VORKOCH_TAGE,
  findeEintrag,
  haltbarkeitsWarnung,
  istLeer,
  kocheintraegeAm,
  planKopieren,
  slotLabel,
  slotTag,
  verplantePortionen,
  warnungImSlot,
} from '../domain/plan'
import { TAGE, type Kocheintrag, type SlotId, type Tag } from '../domain/typen'
import { tagLabel, wocheVerschieben } from '../domain/woche'
import { PlusIcon, WarnIcon } from '../ui/Icons'
import { WochenKopf } from '../ui/WochenKopf'
import { SlotSheet } from './SlotSheet'

interface OffenerSlot {
  slot: SlotId
  kochId?: string
}

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

function VorkochZeile({ eintrag, onOeffnen }: { eintrag: Kocheintrag; onOeffnen: () => void }) {
  const { plan, rezepteNachId } = useAppDaten()
  const rezept = rezepteNachId.get(eintrag.rezeptId)
  const warnung = haltbarkeitsWarnung(plan, eintrag, rezept)
  return (
    <button className="slot kochen" onClick={onOeffnen}>
      <span className="slot-inhalt">
        <span className="slot-name">{rezept?.name ?? eintrag.rezeptName}</span>
        <span className="slot-info">
          {eintrag.portionen} Portionen · {verplantePortionen(plan, eintrag.id)} verplant
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

function TagKarte({ tag, onOeffnen }: { tag: Tag; onOeffnen: (offen: OffenerSlot) => void }) {
  const { plan, wocheId } = useAppDaten()
  const slots = SLOTS.filter((slot) => slotTag(slot) === tag)
  const kopf = (
    <h2>
      {TAG_NAMEN[tag]} <span className="gedaempft">{tagLabel(wocheId, tag)}</span>
    </h2>
  )

  if (!VORKOCH_TAGE.includes(tag)) {
    return (
      <section className="tag-karte">
        {kopf}
        {slots.map((slot) => (
          <SlotZeile key={slot} slot={slot} onOeffnen={() => onOeffnen({ slot })} />
        ))}
      </section>
    )
  }

  const slot = slots[0]
  return (
    <section className="tag-karte">
      {kopf}
      {kocheintraegeAm(plan, tag).map((eintrag) => (
        <VorkochZeile key={eintrag.id} eintrag={eintrag} onOeffnen={() => onOeffnen({ slot, kochId: eintrag.id })} />
      ))}
      {/* Ältere Pläne können hier noch einen Freitext haben. */}
      {plan.slots[slot]?.art === 'text' && <SlotZeile slot={slot} onOeffnen={() => onOeffnen({ slot })} />}
      <button className="slot leer" onClick={() => onOeffnen({ slot })} aria-label={`${TAG_NAMEN[tag]} vorkochen`}>
        <span>Vorkochen</span>
        <span className="slot-plus">
          <PlusIcon />
        </span>
      </button>
    </section>
  )
}

function KalenderKnopf({ user }: { user: User }) {
  const { plan, rezepteNachId, wocheId } = useAppDaten()
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState('')

  async function uebertragen() {
    setLaeuft(true)
    setMeldung('')
    try {
      const termine = kalenderTermine(plan, rezepteNachId, wocheId)
      await kalenderAbgleichen(user, wocheId, termine)
      setMeldung(termine.length === 1 ? '1 Termin im Kalender.' : `${termine.length} Termine im Kalender.`)
    } catch (e) {
      setMeldung(kalenderFehlerText(e))
    }
    setLaeuft(false)
  }

  return (
    <>
      <button className="knopf breit" onClick={uebertragen} disabled={laeuft || !navigator.onLine}>
        {laeuft ? 'Wird übertragen …' : 'In Google Kalender übertragen'}
      </button>
      {meldung && <p className="gedaempft mitte klein-text" role="status">{meldung}</p>}
    </>
  )
}

export function Woche({ user }: { user: User | null }) {
  const { plan, planAendern, speicher, wocheId, geladen, fehlerMelden } = useAppDaten()
  const [offen, setOffen] = useState<OffenerSlot | null>(null)
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
            <TagKarte key={tag} tag={tag} onOeffnen={setOffen} />
          ))}
          {user && <KalenderKnopf key={wocheId} user={user} />}
          <button className="knopf breit" onClick={vorwocheKopieren}>
            Vorwoche als Vorlage kopieren
          </button>
          {hinweis && <p className="gedaempft mitte">{hinweis}</p>}
        </>
      )}
      {offen && <SlotSheet key={`${offen.slot}-${offen.kochId}`} slot={offen.slot} kochId={offen.kochId} onSchliessen={() => setOffen(null)} />}
    </main>
  )
}
