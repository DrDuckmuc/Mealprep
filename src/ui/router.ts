import { useSyncExternalStore } from 'react'

// Hash-Routing braucht auf GitHub Pages keine Serverregeln, und die Android-Zurück-Taste funktioniert.
function abonnieren(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): string {
  return useSyncExternalStore(abonnieren, () => window.location.hash.replace(/^#\/?/, '') || 'woche')
}

export function navigieren(pfad: string): void {
  window.location.hash = `/${pfad}`
}
