const KANTE = 160

// Das Bild liegt als kleine Data-URL direkt im Rezept: Firebase Storage gibt es im Spark-Tarif
// nicht mehr, und so ist es offline da. Größere Bilder würden jedes Rezept-Abo aufblähen.
export async function bildVerkleinern(datei: File): Promise<string> {
  const quelle = await createImageBitmap(datei)
  const seite = Math.min(quelle.width, quelle.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = KANTE
  const kontext = canvas.getContext('2d')
  if (!kontext) throw new Error('Kein Canvas verfügbar')
  // JPEG kennt keine Transparenz, ohne Füllung würde sie schwarz.
  kontext.fillStyle = '#ffffff'
  kontext.fillRect(0, 0, KANTE, KANTE)
  kontext.drawImage(quelle, (quelle.width - seite) / 2, (quelle.height - seite) / 2, seite, seite, 0, 0, KANTE, KANTE)
  quelle.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}
