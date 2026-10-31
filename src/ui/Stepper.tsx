export function Stepper({
  wert,
  onAendern,
  minimum = 1,
  label,
}: {
  wert: number
  onAendern: (wert: number) => void
  minimum?: number
  label: string
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onAendern(wert - 1)} disabled={wert <= minimum} aria-label={`${label} verringern`}>
        −
      </button>
      <output>{wert}</output>
      <button type="button" onClick={() => onAendern(wert + 1)} aria-label={`${label} erhöhen`}>
        +
      </button>
    </div>
  )
}
