import fs from 'node:fs';
import path from 'node:path';
import { FitDaysClient } from 'fitdays-api';
import { normalizeMeasurement } from './normalize.mjs';

function loadEnv(file = path.resolve('.env')) {
  if (!fs.existsSync(file)) throw new Error(`Missing env file: ${file}`);
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i < 1) continue;
    out[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  }
  return out;
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function toEpoch(value, endOfDay = false) {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
  const ms = Date.parse(value.length <= 10 ? value + suffix : value);
  if (!Number.isFinite(ms)) throw new Error(`Invalid date: ${value}`);
  return Math.floor(ms / 1000);
}

const env = loadEnv(arg('--env') || path.resolve('.env'));
const email = env.FITDAYS_EMAIL;
const password = env.FITDAYS_PASSWORD;
if (!email || !password) throw new Error('FITDAYS_EMAIL / FITDAYS_PASSWORD missing');

const now = Math.floor(Date.now() / 1000);
const days = Number(env.FITDAYS_LOOKBACK_DAYS || 7);
const oldest = toEpoch(arg('--from')) ?? now - days * 86400;
const newest = toEpoch(arg('--to'), true) ?? now;
const output = arg('--output') || env.FITDAYS_OUTPUT || '/opt/iobroker/fitdays-sync/fitdays-data.json';

const client = new FitDaysClient({
  region: env.FITDAYS_REGION || 'eu',
  country: env.FITDAYS_COUNTRY || 'DE',
  language: env.FITDAYS_LANGUAGE || 'de'
});
const session = await client.login(email, password);

// fitdays-api intentionally uses endTime as the older boundary and startTime as the newer boundary.
const response = await client.syncFromServer({ endTime: oldest, startTime: newest });
const raw = response?.data?.weight_list || [];
const measurements = raw.map(normalizeMeasurement).filter(Boolean)
  .sort((a, b) => a.measuredTime - b.measuredTime);

const payload = {
  schemaVersion: 1,
  success: true,
  accountUid: String(session.uid),
  generatedAt: new Date().toISOString(),
  range: { oldest, newest },
  count: measurements.length,
  measurements
};

fs.mkdirSync(path.dirname(output), { recursive: true });
const tmp = `${output}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), { mode: 0o640 });
fs.renameSync(tmp, output);
console.log(`FitDays: ${measurements.length} measurements -> ${output}`);
