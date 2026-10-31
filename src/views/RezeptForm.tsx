import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAppDaten } from '../data/AppDaten'
import { parseRezepttext } from '../domain/parser'
import { KATEGORIEN, type Kategorie, type Rezept, type Zutat } from '../domain/typen'
import { bildVerkleinern } from '../ui/bild'
import { KreuzIcon, PlusIcon } from '../ui/Icons'
import { RezeptBild } from '../ui/RezeptBild'
import { navigieren } from '../ui/router'
import { Stepper } from '../ui/Stepper'

const leeresRezept = (id: string): Rezept => ({
  id,
  name: '',
  link: '',
  basisPortionen: 2,
  zutaten: [],
  zubereitung: '',
  kuehlschrankTage: 3,
  einfrierbar: false,
  notizen: '',
  bild: null,
})

function ZutatZeile({ zutat, onAendern, onLoeschen }: { zutat: Zutat; onAendern: (z: Zutat) => void; onLoeschen: () => void }) {
  return (
    <div className="zutat-zeile">
      <input
        className="eingabe"
        inputMode="decimal"
        placeholder="Menge"
        aria-label="Menge"
        defaultValue={zutat.menge === null ? '' : String(zutat.menge).replace('.', ',')}
        onBlur={(e) => {
          const text = e.target.value.trim().replace(',', '.')
          const zahl = Number(text)
          onAendern({ ...zutat, menge: text && Number.isFinite(zahl) ? zahl : null })
        }}
      />
      <input className="eingabe" placeholder="Einheit" aria-label="Einheit" value={zutat.einheit} onChange={(e) => onAendern({ ...zutat, einheit: e.target.value })} />
      <button type="button" className="icon-knopf" onClick={onLoeschen} aria-label={`${zutat.name || 'Zutat'} entfernen`}>
        <KreuzIcon />
      </button>
      <input className="eingabe zutat-name" placeholder="Zutat" aria-label="Name" value={zutat.name} onChange={(e) => onAendern({ ...zutat, name: e.target.value })} />
      <select className="eingabe zutat-kategorie" aria-label="Kategorie" value={zutat.kategorie} onChange={(e) => onAendern({ ...zutat, kategorie: e.target.value as Kategorie })}>
        {KATEGORIEN.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
    </div>
  )
}

export function RezeptForm({ id }: { id?: string }) {
  const { rezepteNachId, speicher } = useAppDaten()
  const vorhanden = id ? rezepteNachId.get(id) : undefined
  const [rezept, setRezept] = useState<Rezept>(() => vorhanden ?? leeresRezept(speicher.neueId()))
  const [einfuegen, setEinfuegen] = useState('')
  // Neue Schlüssel nach dem Einfügen setzen die unkontrollierten Mengenfelder zurück.
  const [zeilenStand, setZeilenStand] = useState(0)
  const [bildFehler, setBildFehler] = useState(false)
  const bildAuswahl = useRef<HTMLInputElement>(null)

  const aendern = (teil: Partial<Rezept>) => setRezept((r) => ({ ...r, ...teil }))

  async function bildGewaehlt(e: ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    // Sonst löst dieselbe Datei beim zweiten Wählen kein change-Ereignis aus.
    e.target.value = ''
    if (!datei) return
    try {
      aendern({ bild: await bildVerkleinern(datei) })
      setBildFehler(false)
    } catch {
      setBildFehler(true)
    }
  }

  function zutatenUebernehmen() {
    const { zutaten, zubereitung, portionen } = parseRezepttext(einfuegen)
    setRezept((r) => ({
      ...r,
      zutaten: [...r.zutaten, ...zutaten],
      zubereitung: r.zubereitung || zubereitung,
      basisPortionen: portionen ?? r.basisPortionen,
    }))
    setEinfuegen('')
    setZeilenStand((s) => s + 1)
  }

  function zutatAendern(index: number, zutat: Zutat) {
    aendern({ zutaten: rezept.zutaten.map((z, i) => (i === index ? zutat : z)) })
  }

  function zutatEntfernen(index: number) {
    aendern({ zutaten: rezept.zutaten.filter((_, i) => i !== index) })
    setZeilenStand((s) => s + 1)
  }

  function speichern(e: FormEvent) {
    e.preventDefault()
    if (!rezept.name.trim()) return
    speicher.rezeptSpeichern({
      ...rezept,
      name: rezept.name.trim(),
      link: rezept.link.trim(),
      zutaten: rezept.zutaten.filter((z) => z.name.trim()),
    })
    navigieren(`rezepte/${rezept.id}`)
  }

  return (
    <main>
      <h1>{id ? 'Rezept bearbeiten' : 'Neues Rezept'}</h1>
      <form className="formular" onSubmit={speichern}>
        <div className="bild-feld">
          <RezeptBild rezept={rezept} />
          <button type="button" className="knopf" onClick={() => bildAuswahl.current?.click()}>
            {rezept.bild ? 'Bild ändern' : 'Bild hochladen'}
          </button>
          {rezept.bild && (
            <button type="button" className="icon-knopf" onClick={() => aendern({ bild: null })} aria-label="Bild entfernen">
              <KreuzIcon />
            </button>
          )}
          <input ref={bildAuswahl} type="file" accept="image/*" hidden onChange={bildGewaehlt} />
        </div>
        {bildFehler && <p className="gedaempft">Dieses Bild konnte nicht gelesen werden.</p>}
        <label>
          Name
          <input className="eingabe" required value={rezept.name} onChange={(e) => aendern({ name: e.target.value })} />
        </label>
        <label>
          Link zum Originalrezept
          <input className="eingabe" type="url" inputMode="url" placeholder="https://" value={rezept.link} onChange={(e) => aendern({ link: e.target.value })} />
        </label>

        <div className="zeile">
          <span>Basisportionen</span>
          <Stepper wert={rezept.basisPortionen} onAendern={(basisPortionen) => aendern({ basisPortionen })} label="Basisportionen" />
        </div>
        <div className="zeile">
          <span>Tage im Kühlschrank</span>
          <input
            className="eingabe klein"
            type="number"
            min="0"
            inputMode="numeric"
            aria-label="Tage im Kühlschrank"
            value={rezept.kuehlschrankTage ?? ''}
            onChange={(e) => aendern({ kuehlschrankTage: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
        <label className="zeile schalter">
          <span>Einfrierbar</span>
          <input type="checkbox" checked={rezept.einfrierbar} onChange={(e) => aendern({ einfrierbar: e.target.checked })} />
        </label>

        <h2>Zutaten</h2>
        <label>
          Rezepttext einfügen
          <textarea
            className="eingabe"
            rows={5}
            placeholder={'200 g Nudeln\n1 EL Olivenöl\n2 Zwiebeln\n1/2 Bund Petersilie\nSalz'}
            value={einfuegen}
            onChange={(e) => setEinfuegen(e.target.value)}
          />
        </label>
        <button type="button" className="knopf breit" onClick={zutatenUebernehmen} disabled={!einfuegen.trim()}>
          Zutaten erkennen
        </button>

        {rezept.zutaten.map((zutat, i) => (
          <ZutatZeile
            key={`${zeilenStand}-${i}`}
            zutat={zutat}
            onAendern={(z) => zutatAendern(i, z)}
            onLoeschen={() => zutatEntfernen(i)}
          />
        ))}
        <button
          type="button"
          className="knopf breit"
          onClick={() => aendern({ zutaten: [...rezept.zutaten, { menge: null, einheit: '', name: '', kategorie: 'Sonstiges' }] })}
        >
          <PlusIcon /> Zutat hinzufügen
        </button>

        <label>
          Zubereitung
          <textarea className="eingabe" rows={7} value={rezept.zubereitung} onChange={(e) => aendern({ zubereitung: e.target.value })} />
        </label>
        <label>
          Notizen
          <textarea className="eingabe" rows={3} value={rezept.notizen} onChange={(e) => aendern({ notizen: e.target.value })} />
        </label>

        <button className="knopf primaer breit" type="submit">Speichern</button>
        <button type="button" className="knopf breit" onClick={() => history.back()}>Abbrechen</button>
      </form>
    </main>
  )
}
