import { collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import type { EinkaufDaten, Rezept, Wochenplan } from '../domain/typen'
import { firestore } from './firebase'
import { LEERER_EINKAUF, START_VORRAT, type FehlerCallback, type Speicher } from './speicher'

export function firestoreSpeicher(uid: string, schreibFehler: FehlerCallback): Speicher {
  const db = firestore()
  const rezepte = collection(db, 'users', uid, 'rezepte')
  const wochen = collection(db, 'users', uid, 'wochen')
  const einkauf = collection(db, 'users', uid, 'einkauf')
  const vorrat = doc(db, 'users', uid, 'meta', 'vorrat')

  return {
    neueId: () => doc(rezepte).id,

    rezepteBeobachten: (callback, fehler) =>
      onSnapshot(rezepte, (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Rezept)), fehler),
    rezeptSpeichern: (rezept) => void setDoc(doc(rezepte, rezept.id), rezept).catch(schreibFehler),
    rezeptLoeschen: (id) => void deleteDoc(doc(rezepte, id)).catch(schreibFehler),

    wocheBeobachten: (wocheId, callback, fehler) =>
      onSnapshot(doc(wochen, wocheId), (d) => callback(d.exists() ? (d.data() as Wochenplan) : null), fehler),
    wocheLesen: async (wocheId) => {
      const d = await getDoc(doc(wochen, wocheId))
      return d.exists() ? (d.data() as Wochenplan) : null
    },
    wocheSpeichern: (wocheId, plan) => void setDoc(doc(wochen, wocheId), plan).catch(schreibFehler),

    einkaufBeobachten: (wocheId, callback, fehler) =>
      onSnapshot(
        doc(einkauf, wocheId),
        (d) => callback({ ...LEERER_EINKAUF, ...(d.data() as Partial<EinkaufDaten> | undefined) }),
        fehler,
      ),
    // Einzelne Felder statt ganzer Dokumente: So gehen beim Sync zweier Geräte keine Haken verloren.
    abhakenSetzen: (wocheId, key, menge) =>
      void setDoc(
        doc(einkauf, wocheId),
        { abgehakt: { [key]: menge === undefined ? deleteField() : menge } },
        { merge: true },
      ).catch(schreibFehler),
    manuellSetzen: (wocheId, eintrag) =>
      void setDoc(doc(einkauf, wocheId), { manuell: { [eintrag.id]: eintrag } }, { merge: true }).catch(schreibFehler),
    manuellLoeschen: (wocheId, id) =>
      void setDoc(doc(einkauf, wocheId), { manuell: { [id]: deleteField() } }, { merge: true }).catch(schreibFehler),

    vorratBeobachten: (callback, fehler) =>
      onSnapshot(vorrat, (d) => callback(d.exists() ? (d.data().eintraege as string[]) : START_VORRAT), fehler),
    vorratSpeichern: (eintraege) => void setDoc(vorrat, { eintraege }).catch(schreibFehler),
  }
}
