# Referenzen

- fitdays-api (npm): https://www.npmjs.com/package/fitdays-api
- fitdays-api Repository: https://github.com/roquerodrigo/fitdays-api
- ioBroker JavaScript Adapter: https://github.com/ioBroker/ioBroker.javascript
- ioBroker SQL Adapter: https://github.com/ioBroker/ioBroker.sql

Stand der Projektvorlage: 2026-08-29.

Wichtige technische Annahmen:

- `fitdays-api` 1.0.3 ist pure ESM und verlangt Node.js >= 22.
- `WeightRecord.suid` wird für die Zuordnung mehrerer FitDays-Unterprofile verwendet.
- `sql.0` unterstützt `storeState` mit frei vorgegebenem `ts`; damit lässt sich der ursprüngliche FitDays-Messzeitpunkt erhalten.
