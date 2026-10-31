# Mealprep

Persönliche Meal-Prep-App: Am Wochenende Mo–Fr planen, daraus entsteht automatisch die Einkaufsliste. Läuft als PWA am PC und auf Android, synchronisiert über Firebase und funktioniert im Supermarkt auch ohne Netz.

Stack: Vite, React, TypeScript, vite-plugin-pwa, Firebase Auth und Firestore, GitHub Pages. Kein eigenes Backend, keine laufenden Kosten.

## Lokal starten

```bash
npm install
npm run dev
```

Ohne `.env` startet die App im **Demo-Modus**: kein Login, Daten nur in diesem Browser. Damit kannst du alles ausprobieren, bevor Firebase eingerichtet ist.

```bash
npm test
npm run build
```

## Einrichtung

Einmalig, etwa 20 Minuten. Die Reihenfolge ist wichtig. Du brauchst nur ein Google-Konto, eine Kreditkarte ist nicht nötig.

### 1. Firebase-Projekt anlegen

1. Auf [console.firebase.google.com](https://console.firebase.google.com) ein neues Projekt anlegen. Google Analytics brauchst du nicht.
2. In der Projektübersicht auf das Web-Symbol `</>` klicken und eine App registrieren. Firebase Hosting **nicht** aktivieren.
3. Firebase zeigt jetzt ein `firebaseConfig`-Objekt. Lass das Fenster offen oder finde es später unter *Projekteinstellungen → Allgemein → Meine Apps*. Du brauchst vier Werte daraus:

| firebaseConfig | Name in `.env` und GitHub Secrets |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Der Tarif bleibt Spark (kostenlos). Diese Werte sind kein echtes Geheimnis, denn sie stehen im ausgelieferten JavaScript. Geschützt werden deine Daten durch die Security Rules aus Schritt 6.

### 2. Google-Login aktivieren

*Authentication → Jetzt starten → Anbieter hinzufügen → Google* aktivieren, Support-E-Mail wählen, speichern.

### 3. Firestore anlegen

*Firestore Database → Datenbank erstellen*. Region in Europa wählen, zum Beispiel `eur3` oder `europe-west3`. Die Region lässt sich später nicht ändern. Im **Produktionsmodus** starten.

### 4. GitHub-Pages-Domain autorisieren

*Authentication → Einstellungen → Autorisierte Domains → Domain hinzufügen*:

```
drduckmuc.github.io
```

Ohne Pfad und ohne `https://`. `localhost` ist schon eingetragen.

### 5. Deine UID herausfinden

1. `.env.example` nach `.env` kopieren und die vier Werte eintragen.
2. `npm run dev` starten und mit Google anmelden.
3. Oben rechts auf das Personen-Symbol tippen. Dort steht deine UID.

Alternativ: *Authentication → Nutzer*, Spalte *Nutzer-UID*.

Bis Schritt 6 erledigt ist, zeigt die App „Kein Zugriff auf die Daten“. Das ist richtig so.

### 6. Security Rules eintragen

1. In der Firebase-Konsole *Firestore Database → Regeln* öffnen.
2. Den Inhalt von [`firestore.rules`](firestore.rules) einfügen.
3. `DEINE_UID` durch deine UID ersetzen und **Veröffentlichen** klicken.

Nur dein Konto kann danach lesen und schreiben. Andere können sich zwar mit Google anmelden, sehen aber keine Daten. Trage die echte UID nur in der Konsole ein, nicht in die Datei im Repo.

### 7. GitHub Secrets setzen

Auf GitHub: *Repo → Settings → Secrets and variables → Actions → New repository secret*. Lege die vier Secrets aus der Tabelle in Schritt 1 an.

Schneller mit der GitHub CLI, jeweils mit deinem Wert:

```bash
gh secret set VITE_FIREBASE_API_KEY
```

### 8. GitHub Pages aktivieren und deployen

1. Auf GitHub: *Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions***.
2. Jeder Push auf `main` testet, baut und veröffentlicht die App. Den Fortschritt siehst du im Tab *Actions*.
3. Hast du die Secrets erst nach dem letzten Push gesetzt: *Actions → Deploy → Run workflow*.

Die App liegt dann unter **https://drduckmuc.github.io/Mealprep/**. Groß- und Kleinschreibung im Pfad zählt.

### 9. Auf Android installieren

1. Die URL in **Chrome** auf dem Handy öffnen und anmelden.
2. Menü ⋮ → *Zum Startbildschirm hinzufügen* → *Installieren*.
3. Die App vom Homescreen starten.

Die installierte App teilt ihren Speicher mit Chrome, die Anmeldung gilt also auch dort. Musst du dich in der installierten App neu anmelden und das Google-Fenster hängt oder schließt sich ohne Ergebnis, tippe auf **In Chrome anmelden**, melde dich dort an und öffne die App danach wieder.

### Offline-Test

1. App online öffnen, Tab *Einkauf* einmal ansehen.
2. Flugmodus an, App schließen und neu starten.
3. Liste abhaken. Oben erscheint *Offline*.
4. Flugmodus aus: Die Haken erscheinen auf dem PC.

Offline verfügbar ist, was das Gerät schon einmal geladen hat: alle Rezepte und die Wochen, die du geöffnet hast. Öffne die Einkaufswoche deshalb einmal mit Netz, bevor du losgehst.

## So funktioniert die App

- **Kochen:** Rezept auf einen Abend legen. Das belegt Abend und nächsten Mittag mit 2 Portionen. Mit mehr Portionen lassen sich über den Reiter *Vorgekocht* weitere Slots belegen.
- **Haltbarkeit:** Liegt die letzte Portion weiter weg als `kuehlschrankTage`, zeigt der Slot eine Warnung mit „einfrieren“ oder „nicht einfrierbar“.
- **Sonntag:** Gemeint ist der Sonntag vor dem Montag der Woche. Am Wochenende öffnet die App automatisch die kommende Woche.
- **Freitag:** Es gibt keinen Folge-Slot, weil der Plan bei Freitagabend endet.
- **Einkaufsliste:** Sie wird nicht gespeichert, sondern aus Plan, Rezepten und Vorrat berechnet. Gespeichert werden nur Haken und manuelle Einträge. Steigt der Bedarf nach dem Abhaken, ist nur die Differenz wieder offen.
- **Mengen:** Stückweise Kaufbares wird aufgerundet, aus 1,5 Zwiebeln werden 2. Unterschiedliche Einheiten bleiben getrennt, zum Beispiel 1 Bund und 20 g Petersilie.
- **Vorrat:** Trifft auch Wortenden, „Öl“ deckt also „Olivenöl“ ab. Was ausgefiltert wurde, steht unten auf der Liste.
- **Liste teilen:** *Kopieren* und *Teilen* geben nur die offenen Einträge als Text aus. Bei gestiegenem Bedarf steht dort nur die fehlende Menge. *Teilen* erscheint nur, wenn der Browser es unterstützt.

## Datenmodell

```
users/{uid}/rezepte/{id}          Rezept
users/{uid}/wochen/{2026-W45}     kocheintraege[], slots{ "mo-abend": … }
users/{uid}/einkauf/{2026-W45}    abgehakt{ schluessel: menge }, manuell{ id: … }
users/{uid}/meta/vorrat           eintraege[]
```

Die Logik liegt getestet in `src/domain`. `src/data` kapselt den Speicher hinter dem Interface `Speicher` (Firestore oder lokal im Demo-Modus).

## Phase 2 (noch offen)

- **Rezept-Import per Link:** Ein Cloudflare Worker liest das schema.org/Recipe-JSON-LD als CORS-Proxy. Die Zutaten laufen danach durch `parseZutaten` und landen im bestehenden Formular.
