import { useMemo, useState, type FormEvent } from 'react'
import { useAppDaten } from '../data/AppDaten'
import { bedarfAusPlan } from '../domain/aggregation'
import { listenEintraege, nachKategorie, type ListenEintrag } from '../domain/einkauf'
import { rateKategorie } from '../domain/kategorien'
import { KreuzIcon } from '../ui/Icons'
import { Sheet } from '../ui/Sheet'
import { WochenKopf } from '../ui/WochenKopf'

function EintragZeile({ eintrag }: { eintrag: ListenEintrag }) {
  const { speicher, wocheId, einkauf } = useAppDaten()

  function umschalten() {
    if (eintrag.manuell) {
      speicher.manuellSetzen(wocheId, { ...einkauf.manuell[eintrag.id], abgehakt: !eintrag.abgehakt })
    } else {
      speicher.abhakenSetzen(wocheId, eintrag.id, eintrag.abgehakt ? undefined : eintrag.menge)
    }
  }

  return (
    <div className={`eintrag ${eintrag.abgehakt ? 'erledigt' : ''}`}>
      <label>
        <input type="checkbox" checked={eintrag.abgehakt} onChange={umschalten} />
        <span className="eintrag-text">
          <span>
            {eintrag.mengeText && <strong>{eintrag.mengeText} </strong>}
            {eintrag.name}
          </span>
          {eintrag.hinweis && <span className="slot-info">{eintrag.hinweis}</span>}
        </span>
      </label>
      {eintrag.manuell && (
        <button className="icon-knopf" onClick={() => speicher.manuellLoeschen(wocheId, eintrag.id)} aria-label={`${eintrag.name} löschen`}>
          <KreuzIcon />
        </button>
      )}
    </div>
  )
}

function VorratSheet({ onSchliessen }: { onSchliessen: () => void }) {
  const { vorrat, speicher } = useAppDaten()
  const [neu, setNeu] = useState('')

  function hinzufuegen(e: FormEvent) {
    e.preventDefault()
    const name = neu.trim()
    if (name && !vorrat.includes(name)) speicher.vorratSpeichern([...vorrat, name])
    setNeu('')
  }

  return (
    <Sheet titel="Vorrat" onSchliessen={onSchliessen}>
      <p className="gedaempft">Diese Zutaten hast du immer da. Sie landen nicht automatisch auf der Liste.</p>
      <div className="chips">
        {vorrat.map((name) => (
          <button key={name} className="chip" onClick={() => speicher.vorratSpeichern(vorrat.filter((v) => v !== name))} aria-label={`${name} entfernen`}>
            {name} <KreuzIcon />
          </button>
        ))}
      </div>
      <form className="eingabe-zeile" onSubmit={hinzufuegen}>
        <input className="eingabe" placeholder="z. B. Essig" value={neu} onChange={(e) => setNeu(e.target.value)} />
        <button className="knopf primaer" type="submit">Hinzufügen</button>
      </form>
    </Sheet>
  )
}

export function Einkauf() {
  const { plan, rezepteNachId, vorrat, einkauf, speicher, wocheId, geladen } = useAppDaten()
  const [nurOffene, setNurOffene] = useState(false)
  const [neu, setNeu] = useState('')
  const [vorratOffen, setVorratOffen] = useState(false)

  const bedarf = useMemo(() => bedarfAusPlan(plan, rezepteNachId, vorrat), [plan, rezepteNachId, vorrat])
  const eintraege = useMemo(() => listenEintraege(bedarf.posten, einkauf), [bedarf, einkauf])
  const offen = eintraege.filter((e) => !e.abgehakt)
  const erledigt = eintraege.filter((e) => e.abgehakt)

  function hinzufuegen(e: FormEvent) {
    e.preventDefault()
    const text = neu.trim()
    if (!text) return
    speicher.manuellSetzen(wocheId, { id: speicher.neueId(), text, kategorie: rateKategorie(text), abgehakt: false })
    setNeu('')
  }

  return (
    <main>
      <WochenKopf />
      <form className="eingabe-zeile" onSubmit={hinzufuegen}>
        <input className="eingabe" placeholder="Eintrag hinzufügen" value={neu} onChange={(e) => setNeu(e.target.value)} />
        <button className="knopf primaer" type="submit">Hinzufügen</button>
      </form>
      <label className="zeile schalter">
        <span>Nur offene anzeigen</span>
        <input type="checkbox" checked={nurOffene} onChange={(e) => setNurOffene(e.target.checked)} />
      </label>

      {!geladen && <p className="gedaempft mitte">Lädt …</p>}
      {geladen && eintraege.length === 0 && <p className="gedaempft mitte">Die Liste ist leer. Plane Rezepte im Tab „Woche“.</p>}
      {geladen && eintraege.length > 0 && offen.length === 0 && <p className="gedaempft mitte">Alles erledigt.</p>}

      {nachKategorie(offen).map((gruppe) => (
        <section key={gruppe.kategorie} className="gruppe">
          <h2>{gruppe.kategorie}</h2>
          {gruppe.eintraege.map((eintrag) => (
            <EintragZeile key={eintrag.id} eintrag={eintrag} />
          ))}
        </section>
      ))}

      {!nurOffene && erledigt.length > 0 && (
        <section className="gruppe">
          <h2>Erledigt ({erledigt.length})</h2>
          {erledigt.map((eintrag) => (
            <EintragZeile key={eintrag.id} eintrag={eintrag} />
          ))}
        </section>
      )}

      {bedarf.ausVorrat.length > 0 && <p className="gedaempft klein-text">Aus dem Vorrat, nicht auf der Liste: {bedarf.ausVorrat.join(', ')}</p>}
      <button className="knopf breit" onClick={() => setVorratOffen(true)}>Vorrat verwalten</button>
      {vorratOffen && <VorratSheet onSchliessen={() => setVorratOffen(false)} />}
    </main>
  )
}
