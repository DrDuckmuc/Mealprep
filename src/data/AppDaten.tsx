import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { leererPlan } from '../domain/plan'
import type { EinkaufDaten, Rezept, Wochenplan } from '../domain/typen'
import { planungsWoche } from '../domain/woche'
import { LEERER_EINKAUF, START_VORRAT, type Speicher } from './speicher'

interface AppDatenWert {
  speicher: Speicher
  rezepte: Rezept[]
  rezepteNachId: Map<string, Rezept>
  vorrat: string[]
  wocheId: string
  setWocheId: (wocheId: string) => void
  plan: Wochenplan
  planAendern: (aenderung: (plan: Wochenplan) => Wochenplan) => void
  einkauf: EinkaufDaten
  geladen: boolean
  fehler: unknown
  fehlerMelden: (fehler: unknown) => void
}

const Kontext = createContext<AppDatenWert | null>(null)

// Plan und Einkauf werden hier oben abonniert, nicht pro Tab: So liegen beide nach dem
// Öffnen der App im Offline-Cache und die Liste funktioniert im Supermarkt ohne Netz.
export function AppDatenProvider({
  speicher,
  fehler,
  fehlerMelden,
  children,
}: {
  speicher: Speicher
  fehler: unknown
  fehlerMelden: (fehler: unknown) => void
  children: ReactNode
}) {
  const [rezepte, setRezepte] = useState<Rezept[] | null>(null)
  const [vorrat, setVorrat] = useState(START_VORRAT)
  const [wocheId, setWocheId] = useState(() => planungsWoche(new Date()))
  const [plan, setPlan] = useState<{ wocheId: string; plan: Wochenplan } | null>(null)
  const [einkauf, setEinkauf] = useState<EinkaufDaten>(LEERER_EINKAUF)

  useEffect(() => speicher.rezepteBeobachten(setRezepte, fehlerMelden), [speicher, fehlerMelden])
  useEffect(() => speicher.vorratBeobachten(setVorrat, fehlerMelden), [speicher, fehlerMelden])
  useEffect(
    () => speicher.wocheBeobachten(wocheId, (p) => setPlan({ wocheId, plan: p ?? leererPlan() }), fehlerMelden),
    [speicher, wocheId, fehlerMelden],
  )
  useEffect(() => speicher.einkaufBeobachten(wocheId, setEinkauf, fehlerMelden), [speicher, wocheId, fehlerMelden])

  const wert = useMemo<AppDatenWert>(() => {
    const aktuellerPlan = plan?.wocheId === wocheId ? plan.plan : null
    return {
      speicher,
      rezepte: rezepte ?? [],
      rezepteNachId: new Map((rezepte ?? []).map((r) => [r.id, r])),
      vorrat,
      wocheId,
      setWocheId,
      plan: aktuellerPlan ?? leererPlan(),
      planAendern: (aenderung) => {
        if (aktuellerPlan) speicher.wocheSpeichern(wocheId, aenderung(aktuellerPlan))
      },
      einkauf,
      geladen: rezepte !== null && aktuellerPlan !== null,
      fehler,
      fehlerMelden,
    }
  }, [speicher, rezepte, vorrat, wocheId, plan, einkauf, fehler, fehlerMelden])

  return <Kontext.Provider value={wert}>{children}</Kontext.Provider>
}

export function useAppDaten(): AppDatenWert {
  const wert = useContext(Kontext)
  if (!wert) throw new Error('useAppDaten braucht einen AppDatenProvider')
  return wert
}
