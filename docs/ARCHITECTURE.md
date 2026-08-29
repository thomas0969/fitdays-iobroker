# Architektur

## Komponenten

1. **FitDays-App / Cloud** – die Waage synchronisiert zunächst über die offizielle App.
2. **`fitdays-api`** – inoffizielles ESM-SDK für Login und Cloud-Sync.
3. **`src/fitdays-fetch.mjs`** – normalisiert Rohdaten und schreibt atomar eine JSON-Datei.
4. **`iobroker/FitDays_Sync.js`** – liest die JSON-Datei, ordnet Messungen Personen zu und aktualisiert ioBroker.
5. **`sql.0`** – speichert Messwerte mit originalem `measured_time`.

## Warum nicht direkt `import('fitdays-api')` in javascript.0?

Der JavaScript-Adapter nutzt eine VM. Bei pure-ESM-Paketen kann dynamisches Importieren dort fehlschlagen. Der separate Node-Prozess hält die ESM-Grenze klar und macht Fehler leichter diagnostizierbar.

## Normalisierung

Rohwerte werden in `src/normalize.mjs` auf definierte Präzision gebracht. Der Fetch schreibt nur nicht gelöschte Messungen (`is_deleted == 0`).

## Atomare Dateiübergabe

Der Fetch schreibt zuerst `<output>.tmp` und benennt die Datei anschließend um. ioBroker sieht daher entweder die alte vollständige oder die neue vollständige Datei, nie eine halb geschriebene Datei.

## Cursor / Duplikatschutz

Pro Person speichert ioBroker `Status.LetzteDataID`. Nur Einträge nach dieser `data_id` werden als neue Live-Messungen verarbeitet.

Falls die Cursor-ID nicht mehr im aktuellen Lookback-Fenster liegt, importiert das Live-Skript absichtlich nichts automatisch. Das verhindert versehentliche Massen-Duplikate. Für Lücken wird ein gezielter Backfill verwendet.
