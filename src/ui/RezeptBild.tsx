import type { Rezept } from '../domain/typen'

export function RezeptBild({ rezept }: { rezept: Pick<Rezept, 'name' | 'bild'> }) {
  if (rezept.bild) return <img className="rezept-bild" src={rezept.bild} alt="" />
  return (
    <span className="rezept-bild" aria-hidden="true">
      {rezept.name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
