# Fehlersuche

## `A dynamic import callback was not specified`

Ursache: `fitdays-api` wurde innerhalb der ioBroker-JavaScript-VM importiert.

Lösung: Nicht in ioBroker importieren. `src/fitdays-fetch.mjs` als normalen Node-22-Prozess verwenden.

## `ERR_PACKAGE_PATH_NOT_EXPORTED` bei `require('fitdays-api')`

`fitdays-api` ist pure ESM. `require()` ist nicht der unterstützte Weg. In `.mjs` mit `import { FitDaysClient } from 'fitdays-api'` verwenden.

## `EACCES` / Datei nicht gefunden in ioBroker

Prüfen:

```bash
ls -ld /opt/iobroker/fitdays-sync
ls -l /opt/iobroker/fitdays-sync/fitdays-data.json
```

Empfohlenes Verzeichnis: Owner = Fetch-Benutzer, Gruppe = `iobroker`, Modus `2750`; JSON `0640`.

## Login funktioniert, aber 0 Messungen

Das Zeitfenster enthält möglicherweise keine Messung. Testweise:

```bash
node src/fitdays-fetch.mjs --from 2026-08-01 --to 2026-08-31
```

## Doppelte SQL-Einträge

Meist laufen zwei Historisierungswege gleichzeitig:

- native `sql.0` History am Datenpunkt
- zusätzlich `storeState` aus dem Projekt

Im empfohlenen Modus native History für FitDays-DPs deaktivieren.

## `LetzteDataID` nicht im 7-Tage-Fenster

Der Live-Sync stoppt absichtlich den automatischen Catch-up. Zeitraum gezielt abrufen und Backfill ausführen.
