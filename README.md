# FitDays → ioBroker Bridge

Reproduzierbare Integration von **FitDays-kompatiblen Bluetooth-Körperwaagen** in **ioBroker** mit optionaler **MySQL-Historie über `sql.0`**.

Das Projekt trennt die FitDays-Cloud-Anbindung bewusst vom ioBroker-JavaScript-Adapter:

```text
Waage → FitDays App → FitDays Cloud
                     ↓
              Node.js 22 / fitdays-api
                     ↓
      /opt/iobroker/fitdays-sync/fitdays-data.json
                     ↓
              ioBroker javascript.0
                     ↓
        0_userdata.0.Fitdays.<Person>.*
                     ↓
                 sql.0 / MySQL
```

## Warum zwei Prozesse?

`fitdays-api` ist ein **reines ESM-Paket**. In normalen `.mjs`-Programmen unter Node.js 22 funktioniert es direkt. Der ioBroker-JavaScript-Adapter führt Skripte dagegen in einer VM aus; dynamisches `import()` kann dort je nach Adapter-/Controller-Version mit `A dynamic import callback was not specified` scheitern. Deshalb läuft die API-Abfrage als normales Node.js-Programm und ioBroker liest nur eine atomar erzeugte JSON-Datei.

## Funktionen

- FitDays Login über EU/US/CN-Region
- Abruf nur eines begrenzten Zeitfensters (Standard: 7 Tage)
- atomare JSON-Übergabe an ioBroker
- Mehrpersonen-Unterstützung über FitDays-`suid`
- automatische Datenpunkte unter `0_userdata.0.Fitdays.<Name>`
- gerundete Messwerte
- Duplikatschutz über `data_id`
- Status-Datenpunkte pro Person
- SQL-Historie mit **originalem Messzeitpunkt** über `sql.0 storeState`
- einmaliger, wiederholbarer Backfill für historische Zeiträume
- Cron-basierter Dauerbetrieb
- keine Zugangsdaten im ioBroker-Skript

## Unterstützte Werte

| ioBroker-DP | FitDays-Feld | Einheit | Rundung |
|---|---|---:|---:|
| Gewicht | `weight_kg` | kg | 1 |
| BMI | `bmi` | – | 1 |
| Koerperfett | `bfr` | % | 1 |
| Unterhautfett | `sfr` | % | 1 |
| Viszeralfett | `uvi` | Index | 1 |
| Skelettmuskel | `rosm` | % | 1 |
| Muskelanteil | `rom` | % | 1 |
| Grundumsatz | `bmr` | kcal | 0 |
| Knochenmasse | `bm` | kg | 1 |
| Koerperwasser | `vwc` | % | 1 |
| Koerperalter | `bodyage` | Jahre | 0 |
| Protein | `pp` | % | 1 |
| Herzfrequenz | `hr` | bpm | 0 |

`hr = 0` wird als „keine Messung“ behandelt und nicht gespeichert.

## Voraussetzungen

- Linux/Ubuntu mit ioBroker
- Node.js **>= 22**
- ioBroker `javascript.0`
- für Historie: ioBroker `sql.0` mit MySQL/PostgreSQL/SQLite/MSSQL
- funktionierendes FitDays-Konto
- FitDays-kompatible Waage und mindestens eine synchronisierte Messung

Die verwendete Bibliothek `fitdays-api` ist ein inoffizielles SDK. Dieses Repository ist weder mit FitDays noch Icomon verbunden.

## Schnellstart

```bash
git clone <DEINE-REPO-URL> fitdays-iobroker
cd fitdays-iobroker
npm install
cp .env.example .env
chmod 600 .env
nano .env
```

Runtime-Verzeichnis anlegen:

```bash
sudo ./scripts/setup-runtime.sh "$USER"
```

Personen-IDs ermitteln:

```bash
npm run discover
```

Danach `config/persons.example.json` kopieren und anpassen:

```bash
sudo cp config/persons.example.json /opt/iobroker/fitdays-sync/persons.json
sudo chown "$USER":iobroker /opt/iobroker/fitdays-sync/persons.json
sudo chmod 640 /opt/iobroker/fitdays-sync/persons.json
sudo nano /opt/iobroker/fitdays-sync/persons.json
```

Erster Datenabruf:

```bash
npm run fetch
```

Anschließend `iobroker/FitDays_Sync.js` als neues Skript im ioBroker-JavaScript-Adapter einfügen und aktivieren.

## SQL-Historie: wichtige Entscheidung

**Empfohlen:** Die normale History-Option von `sql.0` für die FitDays-Messwert-DPs **nicht aktivieren**. Das Sync-Skript schreibt neue Messungen selbst per `storeState` mit dem originalen FitDays-Zeitstempel in SQL. Dadurch entstehen keine doppelten Einträge zum späteren Synchronisationszeitpunkt.

Falls für diese DPs bereits native `sql.0`-History aktiviert ist, vor dem Einsatz dieser Projektversion deaktivieren. Bestehende Historie bleibt erhalten; nur die automatische zukünftige Aufzeichnung durch `setState()` wird abgeschaltet.

## Automatik alle 15 Minuten

Cronjob des Linux-Benutzers, der Zugriff auf `.env` hat:

```bash
crontab -e
```

Eintragen (Repository-Pfad anpassen):

```cron
*/15 * * * * cd /opt/fitdays-iobroker && /usr/bin/node src/fitdays-fetch.mjs >> /var/log/fitdays-fetch.log 2>&1
```

Das ioBroker-Skript verarbeitet die Datei versetzt um `02,17,32,47` Minuten jeder Stunde.

## Historischen Zeitraum importieren

Beispiel August 2026:

```bash
node src/fitdays-fetch.mjs --from 2026-08-01 --to 2026-08-31
```

Danach `iobroker/FitDays_Backfill.js` einmal im JavaScript-Adapter ausführen. Das Skript prüft vorhandene SQL-Zeitstempel und fügt nur fehlende Werte ein.

## Datenpunktstruktur

```text
0_userdata.0.Fitdays
└── Person1
    ├── Aktuell
    │   ├── Gewicht
    │   ├── BMI
    │   ├── Koerperfett
    │   ├── Unterhautfett
    │   ├── Viszeralfett
    │   ├── Skelettmuskel
    │   ├── Muskelanteil
    │   ├── Grundumsatz
    │   ├── Knochenmasse
    │   ├── Koerperwasser
    │   ├── Koerperalter
    │   ├── Protein
    │   └── Herzfrequenz
    └── Status
        ├── LetzteDataID
        ├── LetzteMessung
        ├── LetzteSynchronisation
        ├── NeueMessungen
        └── Fehler
```

## Mehrere Personen

FitDays unterscheidet Unterprofile über `suid`. Mehrere Personen werden einfach in `persons.json` ergänzt:

```json
{
  "schemaVersion": 1,
  "persons": [
    { "name": "Person1", "active": true, "suid": "111111" },
    { "name": "Person2", "active": true, "suid": "222222" },
    { "name": "Person3", "active": true, "suid": "333333" }
  ]
}
```

## Sicherheit / Datenschutz

- `.env` niemals committen.
- Zugangsdaten nicht in ioBroker-Skripte schreiben.
- Das Runtime-Verzeichnis ist standardmäßig nur für den Fetch-Benutzer und die Gruppe `iobroker` zugänglich.
- `fitdays-data.json` enthält Gesundheits-/Körperdaten und gehört nicht in Git.
- Ändere ein Passwort, wenn es versehentlich in Logs, Chats oder Git veröffentlicht wurde.

## Tests

```bash
npm test
```

CI ist über `.github/workflows/test.yml` vorbereitet.

## Dokumentation

- [Installation](docs/INSTALLATION.md)
- [Architektur](docs/ARCHITECTURE.md)
- [SQL-Historie und Backfill](docs/SQL_HISTORY.md)
- [Mehrpersonenbetrieb](docs/MULTI_PERSON.md)
- [Fehlersuche](docs/TROUBLESHOOTING.md)
- [Migration aus einer manuellen Testinstallation](docs/MIGRATION.md)
- [Referenzen](docs/REFERENCES.md)

## Versionshinweise

Dieses Projekt pinnt `fitdays-api` auf **1.0.3**. Das Paket verlangt Node.js >= 22 und ist pure ESM.

## Lizenz

MIT für den Code dieses Repositories. Abhängigkeiten behalten ihre jeweiligen Lizenzen.
