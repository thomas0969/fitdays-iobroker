# Mehrpersonenbetrieb

FitDays-Datensätze enthalten typischerweise `uid` (Konto) und `suid` (Unterprofil/Person). Für mehrere Personen sollte `suid` verwendet werden.

## IDs finden

```bash
npm run discover
```

Beispiel:

```text
suid=111111 uid=999999 measurements=12 last=...
suid=222222 uid=999999 measurements=8 last=...
```

## persons.json

```json
{
  "schemaVersion": 1,
  "persons": [
    { "name": "Alice", "active": true, "suid": "111111" },
    { "name": "Bob",   "active": true, "suid": "222222" }
  ]
}
```

Die Namen werden Teil der ioBroker-ID. Deshalb nur stabile, einfache Namen verwenden und nach Produktivstart nicht leichtfertig umbenennen.
