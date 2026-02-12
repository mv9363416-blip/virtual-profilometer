// frontend/lib/model.js
// 1-в-1 перенос из backend/app/profilometer_model.py

function codeFactors(vc, ap, fn) {
  const t1 = (vc - 190.0) / 65.0;
  const t2 = (ap - 1.55) / 0.45;
  const t3 = (fn - 0.25) / 0.085;
  return { t1, t2, t3 };
}

// аналог random.gauss(0, sigma) через Box–Muller
function gauss0sigma(sigma) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma;
}

export function predictRa(vc, ap, fn, addNoise = false) {
  const { t1, t2, t3 } = codeFactors(vc, ap, fn);

  let ra =
    3.61524662
    + (-0.04226565) * t1 + (-0.30372293) * t2 + (1.54629147) * t3
    + (0.09423727) * t1 * t1 + (0.20077470) * t2 * t2 + (-0.13256723) * t3 * t3
    + (0.19692708) * t1 * t2 + (0.11871875) * t1 * t3 + (-0.27690625) * t2 * t3;

  if (addNoise) {
    // Python: random.gauss(0.0, math.sqrt(0.4459))
    ra += gauss0sigma(Math.sqrt(0.4459));
  }
  return ra;
}

export function predictRz(vc, ap, fn, addNoise = false) {
  const { t1, t2, t3 } = codeFactors(vc, ap, fn);

  let rz =
    15.4077481
    + (-0.14183265) * t1 + (-0.70500268) * t2 + (6.30100359) * t3
    + (-0.04345485) * t1 * t1 + (0.57555821) * t2 * t2 + (-0.18145853) * t3 * t3
    + (0.15654167) * t1 * t2 + (0.413125) * t1 * t3 + (-1.042) * t2 * t3;

  if (addNoise) {
    // Python: random.gauss(0.0, math.sqrt(2.49))
    rz += gauss0sigma(Math.sqrt(2.49));
  }
  return rz;
}
