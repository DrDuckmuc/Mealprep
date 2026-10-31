import { useState } from 'react'
import { useAppDaten } from '../data/AppDaten'
import {
  findeEintrag,
  folgeMittag,
  haltbarkeitsWarnung,
  kochenEintragen,
  portionenSetzen,
  reste,
  resteEintragen,
  slotLabel,
  slotLeeren,
  textEintragen,
  verplantePortionen,
} from '../domain/plan'
import type { Rezept, SlotId } from '../domain/typen'
import { WarnIcon } from '../ui/Icons'
import { navigieren } from '../ui/router'
import { Sheet } from '../ui/Sheet'
import { Stepper } from '../ui/Stepper'

type Reiter = 'rezept' | 'reste' | 'text'

function RezeptWahl({ slot, onFertig }: { slot: SlotId; onFertig: () => void }) {
  const { plan, planAendern, rezepte, speicher } = useAppDaten()
  const folge = folgeMittag(slot)
  const folgeFrei = folge !== null && !plan.slots[folge]
  const [mitFolge, setMitFolge] = useState(folgeFrei)
  const [portionen, setPortionen] = useState(folgeFrei ? 2 : 1)
  const [suche, setSuche] = useState('')

  function folgeUmschalten(aktiv: boolean) {
    setMitFolge(aktiv)
    setPortionen(aktiv ? 2 : 1)
  }

  function waehlen(rezept: Rezept) {
    planAendern((p) => kochenEintragen(p, { id: speicher.neueId(), rezept, slot, portionen, mitFolgeMittag: mitFolge }))
    onFertig()
  }

  const treffer = rezepte
    .filter((r) => r.name.toLowerCase().includes(suche.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <>
      <div className="zeile">
        <span>Portionen</span>
        <Stepper wert={portionen} onAendern={setPortionen} label="Portionen" />
      </div>
      {folge && (
        <label className={`zeile schalter ${folgeFrei ? '' : 'inaktiv'}`}>
          <span>{folgeFrei ? `Auch ${slotLabel(folge)} belegen` : `${slotLabel(folge)} ist schon belegt`}</span>
          <input type="checkbox" checked={mitFolge} disabled={!folgeFrei} onChange={(e) => folgeUmschalten(e.target.checked)} />
        </label>
      )}
      {rezepte.length === 0 ? (
        <p className="gedaempft">
          Noch keine Rezepte vorhanden.{' '}
          <button className="text-knopf" onClick={() => { onFertig(); navigieren('rezepte/neu') }}>
            Rezept anlegen
          </button>
        </p>
      ) : (
        <>
          <input className="eingabe" type="search" placeholder="Rezept suchen" value={suche} onChange={(e) => setSuche(e.target.value)} />
          <div className="liste">
            {treffer.map((rezept) => (
              <button key={rezept.id} className="listen-knopf" onClick={() => waehlen(rezept)}>
                {rezept.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function ResteWahl({ slot, onFertig }: { slot: SlotId; onFertig: () => void }) {
  const { plan, planAendern } = useAppDaten()
  const verfuegbar = reste(plan, slot)

  if (verfuegbar.length === 0) {
    return <p className="gedaempft">Keine freien Portionen. Plane beim Kochen mehr Portionen ein, dann erscheinen sie hier.</p>
  }
  return (
    <div className="liste">
      {verfuegbar.map((eintrag) => (
        <button
          key={eintrag.id}
          className="listen-knopf"
          onClick={() => {
            planAendern((p) => resteEintragen(p, slot, eintrag.id))
            onFertig()
          }}
        >
          {eintrag.rezeptName}
          <span className="slot-info">
            {slotLabel(eintrag.kochSlot)} · {eintrag.portionen - verplantePortionen(plan, eintrag.id)} frei
          </span>
        </button>
      ))}
    </div>
  )
}

function TextWahl({ slot, onFertig }: { slot: SlotId; onFertig: () => void }) {
  const { planAendern } = useAppDaten()
  const [text, setText] = useState('')

  function eintragen(wert: string) {
    if (!wert.trim()) return
    planAendern((p) => textEintragen(p, slot, wert.trim()))
    onFertig()
  }

  return (
    <>
      <div className="chips">
        {['auswärts', 'Reste', 'Kantine'].map((vorschlag) => (
          <button key={vorschlag} className="chip" onClick={() => eintragen(vorschlag)}>
            {vorschlag}
          </button>
        ))}
      </div>
      <form className="eingabe-zeile" onSubmit={(e) => { e.preventDefault(); eintragen(text) }}>
        <input className="eingabe" placeholder="Eigener Text" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="knopf primaer" type="submit">Eintragen</button>
      </form>
    </>
  )
}

function SlotDetails({ slot, onFertig }: { slot: SlotId; onFertig: () => void }) {
  const { plan, planAendern, rezepteNachId } = useAppDaten()
  const inhalt = plan.slots[slot]
  if (!inhalt) return null

  const leeren = () => {
    planAendern((p) => slotLeeren(p, slot))
    onFertig()
  }

  if (inhalt.art === 'text') {
    return (
      <>
        <p>{inhalt.text}</p>
        <button className="knopf gefahr breit" onClick={leeren}>Slot leeren</button>
      </>
    )
  }

  const eintrag = findeEintrag(plan, inhalt.kochId)
  if (!eintrag) return null
  const rezept = rezepteNachId.get(eintrag.rezeptId)
  const warnung = haltbarkeitsWarnung(plan, eintrag, rezept)
  const verplant = verplantePortionen(plan, eintrag.id)
  const istKochSlot = eintrag.kochSlot === slot

  return (
    <>
      <p className="sheet-name">{rezept?.name ?? eintrag.rezeptName}</p>
      {!rezept && <p className="gedaempft">Dieses Rezept wurde gelöscht und zählt nicht für die Einkaufsliste.</p>}
      <p className="gedaempft">Gekocht: {slotLabel(eintrag.kochSlot)}</p>
      <div className="zeile">
        <span>Portionen <span className="gedaempft">({verplant} verplant)</span></span>
        <Stepper wert={eintrag.portionen} onAendern={(p) => planAendern((plan) => portionenSetzen(plan, eintrag.id, p))} label="Portionen" />
      </div>
      {warnung && (
        <p className="warnung">
          <WarnIcon /> {warnung}
        </p>
      )}
      {rezept && (
        <button className="knopf breit" onClick={() => { onFertig(); navigieren(`rezepte/${rezept.id}`) }}>
          Rezept öffnen
        </button>
      )}
      <button className="knopf gefahr breit" onClick={leeren}>
        {istKochSlot ? 'Kocheintrag löschen (alle Slots)' : 'Slot leeren'}
      </button>
    </>
  )
}

export function SlotSheet({ slot, onSchliessen }: { slot: SlotId; onSchliessen: () => void }) {
  const { plan } = useAppDaten()
  const [reiter, setReiter] = useState<Reiter>('rezept')
  // Nach dem Eintragen ist der Slot belegt; das Sheet schließt dann, statt die Details zu zeigen.
  const [warBelegt] = useState(Boolean(plan.slots[slot]))

  return (
    <Sheet titel={slotLabel(slot)} onSchliessen={onSchliessen}>
      {warBelegt ? (
        <SlotDetails slot={slot} onFertig={onSchliessen} />
      ) : (
        <>
          <div className="segmente" role="tablist">
            {(['rezept', 'reste', 'text'] as const).map((r) => (
              <button key={r} role="tab" aria-selected={reiter === r} className={reiter === r ? 'aktiv' : ''} onClick={() => setReiter(r)}>
                {{ rezept: 'Rezept', reste: 'Vorgekocht', text: 'Freitext' }[r]}
              </button>
            ))}
          </div>
          {reiter === 'rezept' && <RezeptWahl slot={slot} onFertig={onSchliessen} />}
          {reiter === 'reste' && <ResteWahl slot={slot} onFertig={onSchliessen} />}
          {reiter === 'text' && <TextWahl slot={slot} onFertig={onSchliessen} />}
        </>
      )}
    </Sheet>
  )
}
