# Installation

## 1. Voraussetzungen prüfen

```bash
node --version
```

Erwartet: `v22.x` oder neuer.

ioBroker-Instanzen prüfen:

```bash
iobroker list instances | grep -E 'javascript|sql'
```

## 2. Repository installieren

Empfohlener Pfad:

```bash
cd /opt
sudo git clone https://github.com/thomas0969/fitdays-iobroker.git
sudo chown -R "$USER":iobroker /opt/fitdays-iobroker
cd /opt/fitdays-iobroker
npm install
```

## 3. Zugangsdaten

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Minimal:

```ini
FITDAYS_EMAIL=user@example.com
FITDAYS_PASSWORD=change-me
FITDAYS_REGION=eu
FITDAYS_COUNTRY=DE
FITDAYS_LANGUAGE=de
FITDAYS_LOOKBACK_DAYS=7
FITDAYS_OUTPUT=/opt/iobroker/fitdays-sync/fitdays-data.json
```

## 4. Gemeinsames Runtime-Verzeichnis

```bash
sudo ./scripts/setup-runtime.sh "$USER"
```

Ergebnis:

```text
/opt/iobroker/fitdays-sync
owner: <fetch-user>
group: iobroker
mode: 2750
```

Das Setgid-Bit sorgt dafür, dass neu angelegte JSON-Dateien die Gruppe `iobroker` erben.

## 5. Personen erkennen

```bash
npm run discover
```

Die Ausgabe zeigt `suid`. Für Mehrpersonenbetrieb ist `suid` die bevorzugte Zuordnung.

## 6. Personen konfigurieren

```bash
sudo cp config/persons.example.json /opt/iobroker/fitdays-sync/persons.json
sudo chown "$USER":iobroker /opt/iobroker/fitdays-sync/persons.json
sudo chmod 640 /opt/iobroker/fitdays-sync/persons.json
sudo nano /opt/iobroker/fitdays-sync/persons.json
```

## 7. Fetch testen

```bash
npm run fetch
ls -lh /opt/iobroker/fitdays-sync/fitdays-data.json
```

Optional:

```bash
python3 -m json.tool /opt/iobroker/fitdays-sync/fitdays-data.json | head -80
```

## 8. ioBroker-Skript installieren

Im Admin unter JavaScript ein neues Skript anlegen und den Inhalt von `iobroker/FitDays_Sync.js` einfügen.

Beim ersten Start werden Datenpunkte angelegt. Der erste Live-Start setzt den Cursor auf die neueste bereits vorhandene Messung und importiert alte Messungen **nicht** automatisch. Für Historie dient der Backfill.

## 9. Cron aktivieren

```bash
crontab -e
```

Beispiel:

```cron
*/15 * * * * cd /opt/fitdays-iobroker && /usr/bin/node src/fitdays-fetch.mjs >> /tmp/fitdays-fetch.log 2>&1
```

Das ioBroker-Skript läuft bei Minute 2/17/32/47.
