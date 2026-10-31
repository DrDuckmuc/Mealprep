const MAX_KANTE = 800

// Das Bild liegt als Data-URL direkt im Rezept: Firebase Storage gibt es im Spark-Tarif
// nicht mehr, und so ist es offline da. Es muss als Titelbild reichen, darf aber nicht zu
// groß werden, weil jedes Rezept-Abo alle Bilder mitlädt und ein Dokument maximal 1 MiB fasst.
export async function bildVerkleinern(datei: File): Promise<string> {
  const quelle = await createImageBitmap(datei)
  const faktor = Math.min(1, MAX_KANTE / Math.max(quelle.width, quelle.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(quelle.width * faktor)
  canvas.height = Math.round(quelle.height * faktor)
  const kontext = canvas.getContext('2d')
  if (!kontext) throw new Error('Kein Canvas verfügbar')
  // JPEG kennt keine Transparenz, ohne Füllung würde sie schwarz.
  kontext.fillStyle = '#ffffff'
  kontext.fillRect(0, 0, canvas.width, canvas.height)
  kontext.drawImage(quelle, 0, 0, canvas.width, canvas.height)
  quelle.close()
  return canvas.toDataURL('image/jpeg', 0.75)
}
