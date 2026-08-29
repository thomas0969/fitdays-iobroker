# Migration aus einer manuellen/Test-Installation

1. Altes August-/Import-Skript deaktivieren.
2. Altes Live-Skript deaktivieren.
3. Bestehende `0_userdata.0.Fitdays.<Person>.Aktuell.*` können beibehalten werden.
4. Native SQL-History auf diesen DPs deaktivieren, wenn der neue `storeState`-Modus genutzt wird.
5. `persons.json` mit der richtigen `suid` anlegen.
6. `npm run fetch` ausführen.
7. Neues `FitDays_Sync.js` installieren und einmal starten.
8. Bei Bedarf Historie über gezielten Backfill ergänzen.

Bestehende SQL-Historie wird durch das Deaktivieren der History-Einstellung nicht gelöscht.
