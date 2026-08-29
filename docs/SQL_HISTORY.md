# SQL-Historie und Backfill

## Empfohlener Modus

Die FitDays-Datenpunkte **nicht** zusätzlich über die normale `sql.0`-History-Checkbox historisieren.

`FitDays_Sync.js` ruft für neue Messungen `sql.0 -> storeState` auf und übergibt den originalen FitDays-Zeitstempel (`measuredTime * 1000`). Erst danach werden die aktuellen ioBroker-DPs aktualisiert.

Vorteile:

- echter Messzeitpunkt statt Sync-Zeitpunkt
- keine doppelten Historieneinträge
- History funktioniert auch dann, wenn die Messung einige Minuten vor dem Cloud-Abruf erfolgte

## Einmaliger Backfill

1. Gewünschten Zeitraum abrufen:

```bash
node src/fitdays-fetch.mjs --from 2026-08-01 --to 2026-08-31
```

2. `iobroker/FitDays_Backfill.js` einmal ausführen.

Das Backfill-Skript liest für jeden DP vorhandene SQL-Zeitstempel über `getHistory(... aggregate: 'none')` und speichert nur fehlende Zeitstempel. Dadurch kann der Import wiederholt werden, ohne denselben Zeitstempel erneut einzufügen.

## Wenn native SQL-History schon aktiv ist

Vor dem produktiven Einsatz des empfohlenen Modus in den Objekt-Custom-Einstellungen für FitDays deaktivieren. Bereits vorhandene SQL-Daten werden dadurch nicht gelöscht.

## Alte Test-Duplikate

Frühere Testinstallationen können zusätzliche Werte zum Import-/Sync-Zeitpunkt enthalten. Diese können im `sql.0` Datenbrowser oder über `delete`/`deleteRange` entfernt werden. Vorher Backup erstellen.
