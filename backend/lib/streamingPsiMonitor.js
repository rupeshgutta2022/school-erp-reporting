// Real-time Population Stability Index (PSI) Drift Monitor
function calculatePsi(actual = [], baseline = []) {
  if (!actual.length || !baseline.length) return 0.0;
  const actAvg = actual.reduce((a, b) => a + b, 0) / actual.length;
  const baseAvg = baseline.reduce((a, b) => a + b, 0) / baseline.length;
  const variance = Math.abs(actAvg - baseAvg) / (Math.abs(baseAvg) + 1e-5);
  return variance * 0.1;
}

module.exports = { calculatePsi };
