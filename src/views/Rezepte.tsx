import { useState } from 'react'
import { useAppDaten } from '../data/AppDaten'
import { formatMenge } from '../domain/einheiten'
import { skaliereZutaten } from '../domain/skalierung'
import type { Rezept } from '../domain/typen'
import { PlusIcon } from '../ui/Icons'
import { RezeptBild } from '../ui/RezeptBild'
import { navigieren } from '../ui/router'
import { Stepper } from '../ui/Stepper'

export function sichererLink(link: string): string | null {
  return /^https?:\/\//i.test(link.trim()) ? link.trim() : null
}

function haltbarkeit(rezept: Rezept): string {
  const teile: string[] = []
  if (rezept.kuehlschrankTage !== null) {
    teile.push(`Kühlschrank ${rezept.kuehlschrankTage} ${rezept.kuehlschrankTage === 1 ? 'Tag' : 'Tage'}`)
  }
  teile.push(rezept.einfrierbar ? 'einfrierbar' : 'nicht einfrierbar')
  return teile.join(' · ')
}

export function RezeptListe() {
  const { rezepte } = useAppDaten()
  const [suche, setSuche] = useState('')
  const begriff = suche.trim().toLowerCase()
  const treffer = rezepte
    .filter((r) => r.name.toLowerCase().includes(begriff) || r.zutaten.some((z) => z.name.toLowerCase().includes(begriff)))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <main>
      <input className="eingabe" type="search" placeholder="Rezept oder Zutat suchen" value={suche} onChange={(e) => setSuche(e.target.value)} />
      {rezepte.length === 0 && <p className="gedaempft mitte">Noch keine Rezepte. Leg dein erstes an.</p>}
      {rezepte.length > 0 && treffer.length === 0 && <p className="gedaempft mitte">Nichts gefunden.</p>}
      <div className="liste">
        {treffer.map((rezept) => (
          <button key={rezept.id} className="listen-knopf rezept-knopf" onClick={() => navigieren(`rezepte/${rezept.id}`)}>
            <RezeptBild rezept={rezept} />
            <span>
              {rezept.name}
              <span className="slot-info">{haltbarkeit(rezept)}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="fab" onClick={() => navigieren('rezepte/neu')} aria-label="Neues Rezept">
        <PlusIcon />
      </button>
    </main>
  )
}

export function RezeptDetail({ id }: { id: string }) {
  const { rezepteNachId, speicher } = useAppDaten()
  const rezept = rezepteNachId.get(id)
  const [portionen, setPortionen] = useState(rezept?.basisPortionen ?? 2)

  if (!rezept) {
    return (
      <main>
        <p className="gedaempft mitte">Rezept nicht gefunden.</p>
      </main>
    )
  }

  const link = sichererLink(rezept.link)

  function loeschen() {
    if (!confirm(`„${rezept!.name}“ löschen? Geplante Kocheinträge bleiben stehen, zählen aber nicht mehr für die Einkaufsliste.`)) return
    speicher.rezeptLoeschen(rezept!.id)
    navigieren('rezepte')
  }

  return (
    <main>
      <button className="text-knopf" onClick={() => navigieren('rezepte')}>← Alle Rezepte</button>
      {rezept.bild ? (
        <div className="titel-bild">
          <img src={rezept.bild} alt="" />
          <h1>{rezept.name}</h1>
        </div>
      ) : (
        <h1>{rezept.name}</h1>
      )}
      <p className="gedaempft">{haltbarkeit(rezept)}</p>
      {link && (
        <p>
          <a href={link} target="_blank" rel="noreferrer">Originalrezept öffnen</a>
        </p>
      )}

      <div className="zeile">
        <h2>Zutaten</h2>
        <Stepper wert={portionen} onAendern={setPortionen} label="Portionen" />
      </div>
      <ul className="zutaten">
        {skaliereZutaten(rezept.zutaten, rezept.basisPortionen, portionen).map((z, i) => (
          <li key={i}>
            <span className="zutat-menge">{formatMenge(z.menge, z.einheit)}</span>
            <span>{z.name}</span>
          </li>
        ))}
      </ul>

      {rezept.zubereitung && (
        <>
          <h2>Zubereitung</h2>
          <p className="freitext">{rezept.zubereitung}</p>
        </>
      )}
      {rezept.notizen && (
        <>
          <h2>Notizen</h2>
          <p className="freitext">{rezept.notizen}</p>
        </>
      )}

      <button className="knopf breit" onClick={() => navigieren(`rezepte/${rezept.id}/bearbeiten`)}>Bearbeiten</button>
      <button className="knopf gefahr breit" onClick={loeschen}>Löschen</button>
    </main>
  )
}
