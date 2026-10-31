import { normalisiereEinheit } from './einheiten'
import { rateKategorie } from './kategorien'
import type { Zutat } from './typen'

const BRUECHE: Record<string, string> = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅛': '1/8' }
const ZAHLWOERTER: Record<string, number> = { ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6 }

const ZAHL = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`
const MENGE_VORNE = new RegExp(String.raw`^(${ZAHL})(?:\s*(?:-|–|bis)\s*(${ZAHL}))?\s*(.*)$`, 'i')
const MENGE_HINTEN = new RegExp(String.raw`^(.+?)[:\s]\s*(${ZAHL})\s*([\p{L}.]+)$`, 'iu')

const VORSPANN = /^(?:ca\.?|circa|etwa|ungefähr|evtl\.?|optional|etwas|nach belieben)\s+/i
const GROESSE = /^(?:klein|groß|mittelgroß|mittler)e?[nrs]?\s+/i

function zahlLesen(text: string): number {
  const teile = text.trim().split(/\s+/)
  return teile.reduce((summe, teil) => {
    const [zaehler, nenner] = teil.split('/')
    return summe + (nenner ? Number(zaehler) / Number(nenner) : Number(teil.replace(',', '.')))
  }, 0)
}

function nameBereinigen(name: string): string {
  return name.replace(/^von\s+/i, '').replace(GROESSE, '').trim()
}

function zutat(menge: number | null, einheit: string, rohName: string): Zutat {
  const name = nameBereinigen(rohName)
  return { menge, einheit, name, kategorie: rateKategorie(name) }
}

function einheitUndName(rest: string): { einheit: string; name: string } {
  const [wort = '', ...weitere] = rest.split(/\s+/)
  const einheit = normalisiereEinheit(wort)
  return einheit === undefined ? { einheit: '', name: rest } : { einheit, name: weitere.join(' ') }
}

/** Parst eine Zutatenzeile. Fehlt der Name ("200 g"), bleibt er leer. */
export function parseZutat(zeile: string): Zutat | null {
  let text = zeile
    .replace(/^[\s\-–•*·▢☐]+/, '')
    .replace(/(\d)?([½¼¾⅓⅔⅛])/g, (_, ganz, bruch) => `${ganz ? `${ganz} ` : ''}${BRUECHE[bruch]}`)
    .replace(/\s+/g, ' ')
    .trim()
  while (VORSPANN.test(text)) text = text.replace(VORSPANN, '')
  if (!text) return null

  const vorne = text.match(MENGE_VORNE)
  if (vorne) {
    // Bei Spannen ("2-3 Tomaten") zählt der obere Wert, damit die Menge sicher reicht.
    const menge = zahlLesen(vorne[2] ?? vorne[1])
    const { einheit, name } = einheitUndName(vorne[3])
    return zutat(menge, einheit, name)
  }

  const zahlwort = text.match(/^(\p{L}+)\s+(.+)$/u)
  const wortMenge = zahlwort && ZAHLWOERTER[zahlwort[1].toLowerCase()]
  if (zahlwort && wortMenge) {
    const { einheit, name } = einheitUndName(zahlwort[2])
    return zutat(wortMenge, einheit, name)
  }

  const hinten = text.match(MENGE_HINTEN)
  const hintenEinheit = hinten ? normalisiereEinheit(hinten[3]) : undefined
  if (hinten && hintenEinheit !== undefined) {
    return zutat(zahlLesen(hinten[2]), hintenEinheit, hinten[1].replace(/:$/, ''))
  }

  return zutat(null, '', text)
}

function istUeberschrift(zeile: string): boolean {
  return /:\s*$/.test(zeile) || /^(?:zutaten|für\s+(?:das|den|die)\b)/i.test(zeile.trim())
}

/** Parst mehrere Zeilen. Eine Zeile nur mit Menge ("200 g") gehört zur nächsten Zeile. */
export function parseZutaten(text: string): Zutat[] {
  const zutaten: Zutat[] = []
  let offen: Zutat | null = null
  for (const zeile of text.split(/\r?\n/)) {
    if (!zeile.trim() || istUeberschrift(zeile)) continue
    const geparst = parseZutat(zeile)
    if (!geparst) continue
    if (!geparst.name) {
      offen = geparst
    } else if (offen && geparst.menge === null) {
      zutaten.push({ ...geparst, menge: offen.menge, einheit: offen.einheit })
      offen = null
    } else {
      zutaten.push(geparst)
      offen = null
    }
  }
  return zutaten
}

export interface GeparsterRezepttext {
  zutaten: Zutat[]
  zubereitung: string
  portionen: number | null
}

/** Zerlegt einen kompletten Rezepttext; ohne Überschriften gilt alles als Zutatenliste. */
export function parseRezepttext(text: string): GeparsterRezepttext {
  const zeilen = text.split(/\r?\n/)
  const zutatenStart = zeilen.findIndex((z) => /^\s*zutaten\b/i.test(z))
  const zubereitungStart = zeilen.findIndex((z) => /^\s*(?:zubereitung|anleitung|so geht'?s|arbeitsschritte)\b/i.test(z))

  const bis = zubereitungStart >= 0 ? zubereitungStart : zeilen.length
  const zutatenZeilen = zeilen.slice(zutatenStart >= 0 && zutatenStart < bis ? zutatenStart + 1 : 0, bis)
  const portionenTreffer = text.match(/(\d+)\s*(?:portionen|personen)/i)

  return {
    zutaten: parseZutaten(zutatenZeilen.filter((z) => !/\d+\s*(?:portionen|personen)/i.test(z)).join('\n')),
    zubereitung: zubereitungStart >= 0 ? zeilen.slice(zubereitungStart + 1).join('\n').trim() : '',
    portionen: portionenTreffer ? Number(portionenTreffer[1]) : null,
  }
}
