export const METRICS = Object.freeze({
  Gewicht:       { field: 'weight_kg', decimals: 1, unit: 'kg' },
  BMI:           { field: 'bmi',       decimals: 1, unit: '' },
  Koerperfett:   { field: 'bfr',       decimals: 1, unit: '%' },
  Unterhautfett: { field: 'sfr',       decimals: 1, unit: '%' },
  Viszeralfett:  { field: 'uvi',       decimals: 1, unit: 'Index' },
  Skelettmuskel: { field: 'rosm',      decimals: 1, unit: '%' },
  Muskelanteil:  { field: 'rom',       decimals: 1, unit: '%' },
  Grundumsatz:   { field: 'bmr',       decimals: 0, unit: 'kcal' },
  Knochenmasse:  { field: 'bm',        decimals: 1, unit: 'kg' },
  Koerperwasser: { field: 'vwc',       decimals: 1, unit: '%' },
  Koerperalter:  { field: 'bodyage',   decimals: 0, unit: 'Jahre' },
  Protein:       { field: 'pp',        decimals: 1, unit: '%' },
  Herzfrequenz:  { field: 'hr',        decimals: 0, unit: 'bpm', zeroIsMissing: true }
});

export function roundValue(value, decimals) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (decimals === 0) return Math.round(n);
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function normalizeMeasurement(raw) {
  if (!raw || Number(raw.is_deleted || 0) !== 0) return null;
  const measuredTime = Number(raw.measured_time);
  if (!Number.isFinite(measuredTime) || measuredTime <= 0) return null;

  const values = {};
  for (const [name, cfg] of Object.entries(METRICS)) {
    const source = raw[cfg.field];
    if (source === undefined || source === null) continue;
    const n = Number(source);
    if (!Number.isFinite(n)) continue;
    if (cfg.zeroIsMissing && n === 0) continue;
    const rounded = roundValue(n, cfg.decimals);
    if (rounded !== null) values[name] = rounded;
  }

  return {
    dataId: String(raw.data_id || raw.id || `${raw.suid || raw.uid}_${measuredTime}`),
    uid: raw.uid == null ? '' : String(raw.uid),
    suid: raw.suid == null ? '' : String(raw.suid),
    measuredTime,
    measuredAt: new Date(measuredTime * 1000).toISOString(),
    values
  };
}
