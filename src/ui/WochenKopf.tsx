import { useAppDaten } from '../data/AppDaten'
import { planungsWoche, wocheLabel, wocheVerschieben } from '../domain/woche'
import { LinksIcon, RechtsIcon } from './Icons'

export function WochenKopf() {
  const { wocheId, setWocheId } = useAppDaten()
  const standard = planungsWoche(new Date())
  return (
    <div className="wochen-kopf">
      <button className="icon-knopf" onClick={() => setWocheId(wocheVerschieben(wocheId, -1))} aria-label="Vorherige Woche">
        <LinksIcon />
      </button>
      <button className="wochen-label" onClick={() => setWocheId(standard)} disabled={wocheId === standard} title="Zur Planungswoche">
        {wocheLabel(wocheId)}
      </button>
      <button className="icon-knopf" onClick={() => setWocheId(wocheVerschieben(wocheId, 1))} aria-label="Nächste Woche">
        <RechtsIcon />
      </button>
    </div>
  )
}
