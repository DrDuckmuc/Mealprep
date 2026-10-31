import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const konfiguration = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseKonfiguriert = Object.values(konfiguration).every(Boolean)

let db: Firestore | undefined

function app(): FirebaseApp {
  return getApps()[0] ?? initializeApp(konfiguration)
}

export function firebaseAuth(): Auth {
  return getAuth(app())
}

export function firestore(): Firestore {
  db ??= initializeFirestore(app(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  return db
}
