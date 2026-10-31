import { afterEach, describe, expect, it, vi } from 'vitest'
import { kalenderFehlerText, KalenderFehler, termineSchreiben } from './kalender'
import { terminId } from '../domain/kalender'
import { TAGE } from '../domain/typen'

const termin = { tag: 'mo' as const, datum: '2026-11-02', titel: 'Kochen: Curry' }

function fetchNachbilden(antworten: (url: string, methode: string) => number) {
  const aufrufe: string[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const status = antworten(url, init.method!)
    aufrufe.push(`${init.method} ${url.split('/events')[1]} ${status}`)
    return new Response(status === 204 ? null : 'antwort', { status })
  })
  return aufrufe
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('termineSchreiben', () => {
  it('schreibt Abende mit Termin und leert alle anderen', async () => {
    const aufrufe = fetchNachbilden((_, methode) => (methode === 'PUT' ? 200 : 204))
    await termineSchreiben('token', '2026-W45', [termin])
    expect(aufrufe).toHaveLength(TAGE.length)
    expect(aufrufe.filter((a) => a.startsWith('PUT'))).toEqual([`PUT /${terminId('2026-W45', 'mo')} 200`])
  })

  it('legt einen unbekannten Termin neu an', async () => {
    const aufrufe = fetchNachbilden((_, methode) => (methode === 'PUT' ? 404 : methode === 'POST' ? 200 : 410))
    await termineSchreiben('token', '2026-W45', [termin])
    expect(aufrufe).toContain('POST  200')
  })

  it('ignoriert Löschen von nicht vorhandenen Terminen', async () => {
    fetchNachbilden(() => 404)
    await expect(termineSchreiben('token', '2026-W45', [])).resolves.toBeUndefined()
  })

  it('bricht bei einem echten Fehler ab', async () => {
    fetchNachbilden(() => 500)
    await expect(termineSchreiben('token', '2026-W45', [])).rejects.toBeInstanceOf(KalenderFehler)
  })
})

describe('kalenderFehlerText', () => {
  it('erkennt eine nicht aktivierte API', () => {
    expect(kalenderFehlerText(new KalenderFehler(403, '{"reason":"accessNotConfigured"}'))).toContain('Calendar API')
  })

  it('erkennt eine fehlende Freigabe', () => {
    expect(kalenderFehlerText(new KalenderFehler(403, '{"reason":"insufficientPermissions"}'))).toContain('nicht erlaubt')
  })
})
