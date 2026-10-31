import { useEffect, useRef, type ReactNode } from 'react'
import { KreuzIcon } from './Icons'

/** Bottom-Sheet. Belegt einen History-Eintrag, damit die Android-Zurück-Taste es schließt. */
export function Sheet({ titel, onSchliessen, children }: { titel: string; onSchliessen: () => void; children: ReactNode }) {
  const schliessen = useRef(onSchliessen)
  schliessen.current = onSchliessen
  const offen = useRef(false)

  useEffect(() => {
    const zurueck = () => schliessen.current()
    offen.current = true
    if (!history.state?.sheet) history.pushState({ sheet: true }, '')
    window.addEventListener('popstate', zurueck)
    return () => {
      offen.current = false
      window.removeEventListener('popstate', zurueck)
      // StrictMode mountet doppelt: Erst danach steht fest, ob das Sheet wirklich zu ist.
      queueMicrotask(() => {
        if (!offen.current && history.state?.sheet) history.back()
      })
    }
  }, [])

  return (
    <div className="sheet-hintergrund" onClick={onSchliessen}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titel} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-kopf">
          <h2>{titel}</h2>
          <button className="icon-knopf" onClick={onSchliessen} aria-label="Schließen">
            <KreuzIcon />
          </button>
        </div>
        <div className="sheet-inhalt">{children}</div>
      </div>
    </div>
  )
}
