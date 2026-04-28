

function codeFactors(vc, ap, fn) {
  const t1 = (vc - 190.0) / 65.0;
  const t2 = (ap - 1.55) / 0.45;
  const t3 = (fn - 0.245) / 0.085;
  return { t1, t2, t3 };
}


function gauss0sigma(sigma) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma;
}

function mean(arr) {
  if (!arr.length) return 0;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

function movingAverage(arr, w) {
  if (w <= 1) return arr.slice();
  const n = arr.length;
  const half = Math.floor(w / 2);
  const out = new Array(n);

  for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < n) {
        s += arr[j];
        c += 1;
      }
    }
    out[i] = s / c;
  }
  return out;
}

function minRoughnessValue(value) {
  return value < 0 ? 0.01 : value;
}

function roughnessRa(z) {
  if (!z.length) return 0;
  let s = 0;
  for (const v of z) s += Math.abs(v);
  return s / z.length;
}

function roughnessRz(z) {
  // ISO-like: mean of 5 highest peaks + mean abs of 5 deepest valleys
  const n = z.length;
  if (n === 0) return 0;

  const k = n >= 10 ? 5 : Math.max(1, Math.floor(n / 2));
  const zs = [...z].sort((a, b) => a - b);

  const lows = zs.slice(0, k);          // most negative
  const highs = zs.slice(n - k);        // most positive

  const meanHigh = highs.reduce((s, v) => s + v, 0) / k;
  const meanLowAbs = lows.reduce((s, v) => s + Math.abs(v), 0) / k;

  return meanHigh + meanLowAbs;
}

// --- public API ---

export function predictRa(vc, ap, fn, addNoise = false) {
  const { t1, t2, t3 } = codeFactors(vc, ap, fn);

  let ra =
    3.61524662
    + (-0.04226565) * t1 + (-0.30372293) * t2 + (1.54629147) * t3
    + (0.09423727) * t1 * t1 + (0.20077470) * t2 * t2 + (-0.13256723) * t3 * t3
    + (0.19692708) * t1 * t2 + (0.11871875) * t1 * t3 + (-0.27690625) * t2 * t3;

  if (addNoise) {
    // N(0; sqrt(0.4459))
    ra += gauss0sigma(Math.sqrt(0.4459));
  }
  return minRoughnessValue(ra);
}

export function predictRz(vc, ap, fn, addNoise = false) {
  const { t1, t2, t3 } = codeFactors(vc, ap, fn);

  let rz =
    15.4077481
    + (-0.14183265) * t1 + (-0.70500268) * t2 + (6.30100359) * t3
    + (-0.04345485) * t1 * t1 + (0.57555821) * t2 * t2 + (-0.18145853) * t3 * t3
    + (0.15654167) * t1 * t2 + (0.413125) * t1 * t3 + (-1.042) * t2 * t3;

  if (addNoise) {
    // N(0; sqrt(2.48))
    rz += gauss0sigma(Math.sqrt(2.48));
  }
  return minRoughnessValue(rz);
}

export function generateProfileFromRaRz({
  raTarget,
  rzTarget,
  nPoints = 800,
  lengthMm = 4.0,
  addNoise = true,
} = {}) {
  const n = Math.max(200, Math.min(5000, Math.floor(nPoints)));
  const L = Math.max(0.5, Number(lengthMm));

  const raT = Number(raTarget) || 0;
  const rzT = Number(rzTarget) || 0;

  let base = Array.from({ length: n }, () => gauss0sigma(1.0));
  base = movingAverage(base, 9);
  base = movingAverage(base, 9);

  const mBase = mean(base);
  base = base.map((v) => v - mBase);

  const spikes = new Array(n).fill(0);
  const nSpikes = Math.max(3, Math.floor(n / 250));

  for (let s = 0; s < nSpikes; s++) {
    const idx = Math.floor(Math.random() * n);
    const sign = Math.random() < 0.5 ? -1.0 : 1.0;
    for (let d = -3; d <= 3; d++) {
      const j = idx + d;
      if (j >= 0 && j < n) {
        spikes[j] += sign * Math.exp(-(d * d) / 4.0);
      }
    }
  }

  let k = 0.8;
  const eps = 1e-9;
  let z = new Array(n).fill(0);

  for (let it = 0; it < 10; it++) {
    for (let i = 0; i < n; i++) z[i] = base[i] + k * spikes[i];

    const mz = mean(z);
    for (let i = 0; i < n; i++) z[i] -= mz;

    const raNow = roughnessRa(z);
    const scale = raT > 0 ? (raT / (raNow + eps)) : 1.0;
    for (let i = 0; i < n; i++) z[i] *= scale;

    const rzNow = roughnessRz(z);
    if (rzT <= 0) break;

    const ratio = rzT / (rzNow + eps);
    if (ratio >= 0.95 && ratio <= 1.05) break;

    k *= Math.pow(ratio, 0.7);
  }

  if (addNoise) {
    const sigma = 0.05 * raT + 0.02;
    for (let i = 0; i < n; i++) z[i] += gauss0sigma(sigma);

    const mz2 = mean(z);
    for (let i = 0; i < n; i++) z[i] -= mz2;
  }

  const x = Array.from({ length: n }, (_, i) => i * (L / (n - 1)));
  return { x, z };
}