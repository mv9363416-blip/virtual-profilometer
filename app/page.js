"use client";

import { useEffect, useRef, useState } from "react";

const translations = {
  sk: {
    title: "Virtuálny Drsnomer",
    subtitle: "Zadať parametre rezania → predikcia drsnosti Ra a Rz",
    vc: "Rezná rýchlosť",
    ap: "Hĺbka rezu",
    fn: "Posuv",
    normalDist: "Normálne rozdelenie",
    calculate: "Vypočítať",
    clearHistory: "Vymazať históriu",
    error: "Chyba požiadavky. Skontroluj backend.",
    forexample: "Napríklad",
    history: "História",
    logs: "Záznamy",
    time: "Čas",
    dist: "rozdelenie",
    range: "Rozsah",
    skipAnim: "Preskočiť animácie",
    profilometerS: "Drsnomer",
    distribution: "rozdelenie",
    roughnessG: "Graf drsnosti",
    showDescription: "Zobraziť popis",
    hideDescription: "Skryť popis",
    profilometerDescTitle: "Princíp činnosti profilometra",
    profilometerDesc1:
        "Táto animácia znázorňuje princíp činnosti dotykového profilometra. Meracia hlavica sa pohybuje po povrchu vzorky v smere osi x a kopíruje nerovnosti povrchu.",
    profilometerDesc2:
        "V reálnom meraní hrot sníma výškové odchýlky povrchu a tieto zmeny sa následne spracujú do profilového záznamu. V tejto vizualizácii je pohyb zjednodušený pre lepšiu názornosť.",
    profilometerDesc3:
        "Cieľom animácie je pomôcť pochopiť, ktorá časť zariadenia vykonáva meranie a ako súvisí pohyb snímacej časti s vytvorením grafu drsnosti.",
    graphDescTitle: "Interpretácia grafu drsnosti",
    graphDesc1:
        "Graf zobrazuje profil povrchu v závislosti od polohy x. Zvislá os predstavuje výškové odchýlky povrchu v mikrometroch (µm) a vodorovná os predstavuje hodnotenú dĺžku v milimetroch (mm).",
    graphDesc2:
        "Stredná čiara predstavuje referenčnú úroveň profilu. Parameter Ra vyjadruje priemernú absolútnu odchýlku profilu od tejto strednej čiary.",
    graphDesc3:
        "Parameter Rz vyjadruje výškovú charakteristiku profilu ako rozdiel medzi typickými najvyššími vrcholmi a najhlbšími priehlbinami.",
    graphDesc4:
        "Graf slúži ako názorná pomôcka na pochopenie toho, z ktorých častí profilu vznikajú výsledné hodnoty Ra a Rz.",
  },
  en: {
    title: "Virtual Profilometer",
    subtitle: "Enter cutting parameters → predict surface roughness Ra and Rz",
    vc: "Cutting speed",
    ap: "Depth of cut",
    fn: "Feed",
    normalDist: "Normal distribution",
    calculate: "Calculate",
    clearHistory: "Clear history",
    error: "Request error. Check backend.",
    forexample: "For example",
    history: "History",
    logs: "Logs",
    time: "Time",
    dist: "distribution",
    range: "Range",
    skipAnim: "Skip animations",
    profilometerS: "Profilometer",
    distribution: "distribution",
    roughnessG: "Roughness Graph",
    showDescription: "Show description",
    hideDescription: "Hide description",
    profilometerDescTitle: "Profilometer operating principle",
    profilometerDesc1:
        "This animation illustrates the operating principle of a contact profilometer. The measuring head moves along the sample surface in the x-direction and follows the surface irregularities.",
    profilometerDesc2:
        "In a real measurement, the stylus senses height deviations of the surface and these changes are then processed into a profile record. In this visualization, the motion is simplified for clarity.",
    profilometerDesc3:
        "The goal of the animation is to help explain which part of the device performs the measurement and how the motion of the sensing part relates to the resulting roughness graph.",
    graphDescTitle: "Interpretation of the roughness graph",
    graphDesc1:
        "The graph shows the surface profile as a function of x-position. The vertical axis represents surface height deviations in micrometers (µm), while the horizontal axis represents the evaluated length in millimeters (mm).",
    graphDesc2:
        "The mean line represents the reference level of the profile. The Ra parameter expresses the average absolute deviation of the profile from this mean line.",
    graphDesc3:
        "The Rz parameter expresses the height characteristic of the profile as the difference between typical highest peaks and deepest valleys.",
    graphDesc4:
        "The graph serves as an educational aid to help the user understand which parts of the profile contribute to the resulting Ra and Rz values.",
  }
};

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const API = "";

export default function Home() {
  const [lang, setLang] = useState("sk");
  const t = translations[lang];

  const [vc, setVc] = useState("");
  const [ap, setAp] = useState("");
  const [fn, setFn] = useState("");
  const addNoise = true;

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [profile, setProfile] = useState(null);
  const canvasRef = useRef(null);

  const animRef = useRef(null);
  const profileRef = useRef(null);
  const startTimeRef = useRef(0);
  const skipAnimationsRef = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scanTick, setScanTick] = useState(0);
  const [skipAnimations, setSkipAnimations] = useState(false);
  const [runWithoutAnimation, setRunWithoutAnimation] = useState(false);
  const [showFinalMetrics, setShowFinalMetrics] = useState(false);
  const [showProfilometerDescription, setShowProfilometerDescription] = useState(false);
  const [showGraphDescription, setShowGraphDescription] = useState(false);
  const scanDurationMs = 8000;
  const probeTravelPx = 42;
  const probeAnimation = `probeSideMove ${scanDurationMs}ms linear 1`;

  const vcNum = Number(vc);
  const apNum = Number(ap);
  const fnNum = Number(fn);

  const vcOk = vc.trim() !== "" && Number.isFinite(vcNum) && vcNum >= 80.68 && vcNum <= 299.32;
  const apOk = ap.trim() !== "" && Number.isFinite(apNum) && apNum >= 0.79 && apNum <= 2.31;
  const fnOk = fn.trim() !== "" && Number.isFinite(fnNum) && fnNum >= 0.1 && fnNum <= 0.39;

  const formOk = vcOk && apOk && fnOk;
  async function loadHistory() {
    try {
      const r = await fetch("/api/measurements", { cache: "no-store", credentials: "include" });
      const data = await r.json();
      setHistory(Array.isArray(data) ? data : []);
      console.log("HISTORY LOADED:", Array.isArray(data), Array.isArray(data) ? data.length : data);
    } catch (e) {
      console.error("loadHistory error:", e);
      setHistory([]);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!profile || !canvasRef.current) return;

    profileRef.current = profile;

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    if (skipAnimationsRef.current) {
      setIsAnimating(false);
      drawProfileFrame(canvasRef.current, profile, 1);
      setShowFinalMetrics(true);
      return;
    }

    startTimeRef.current = performance.now();
    setScanTick((v) => v + 1);
    startProfileAnimation();
  }, [profile]);

  useEffect(() => {
    if (!profile || !canvasRef.current) return;

    if (showFinalMetrics) {
      drawProfileFrame(canvasRef.current, profile, 1);
    }
  }, [showFinalMetrics, profile, drawProfileFrame]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  async function onPredict() {
    if(!formOk) {
      setErr("vc, ap, fn.");
      return;
    }

    skipAnimationsRef.current = skipAnimations;
    setRunWithoutAnimation(skipAnimations);

    setErr("");
    setLoading(true);
    setResult(null);
    setShowFinalMetrics(false);

    try {
      const body = {
        vc: vcNum,
        ap: apNum,
        fn: fnNum,
        add_noise: addNoise,
      };

      const r = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || "Request failed");
      }

      const data = await r.json();
      setResult(data);
      setProfile(data.profile);
      profileRef.current = data.profile;

      // animation start
      if (!skipAnimations) {
        startTimeRef.current = performance.now();
        setIsAnimating(true);
      } else {
        setIsAnimating(false);
      }

      await loadHistory();
    } catch (e) {
      setErr("Request error. Check that the backend is running on :8000 and that the numbers are correct.");
    } finally {
      setLoading(false);
    }
  }

  async function onClear() {
    setErr("");
    try {
      console.log("SENDING DELETE", `${API}/measurements`);
      const r = await fetch(`${API}/measurements`, { method: "DELETE", credentials: "include", });
      console.log("DELETE STATUS", r.status);

      if (!r.ok) {
        const text = await r.text();
        throw new Error(`HTTP ${r.status}: ${text}`);
      }
      await loadHistory();
      setResult(null);
    } catch (e) {
      console.error(e);
      setErr(`Clear history error: ${e.message}`);
    }
  }



  function drawProfileFrame(canvas, profile, t01) {
    const { x, z } = profile || {};
    const m = computeMetrics(profile);


    if (!canvas || !x?.length || !z?.length) return;

    const n = x.length;
    const lastIdx = Math.max(1, Math.min(n - 1, Math.floor(t01 * (n - 1))));

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement?.clientWidth ?? 900;
    const cssH = 280;

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = 28;
    const plotW = cssW - pad * 2;
    const plotH = cssH - pad * 2;

    const xmin = x[0];
    const xmax = x[n - 1];

    let zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < n; i++) {
      if (z[i] < zmin) zmin = z[i];
      if (z[i] > zmax) zmax = z[i];
    }
    if (zmin === zmax) { zmin -= 1; zmax += 1; }
    const zr = zmax - zmin;
    zmin -= zr * 0.1;
    zmax += zr * 0.1;

    const mapX = (v) => pad + ((v - xmin) / (xmax - xmin)) * plotW;
    const mapY = (v) => pad + (1 - (v - zmin) / (zmax - zmin)) * plotH;

    // axis
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + plotH);
    ctx.lineTo(pad + plotW, pad + plotH);
    ctx.stroke();

    // zero line
    if (zmin < 0 && zmax > 0) {
      const y0 = mapY(0);
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath();
      ctx.moveTo(pad, y0);
      ctx.lineTo(pad + plotW, y0);
      ctx.stroke();
    }

    // signatures
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("z (µm)", 4, pad - 8);
    ctx.fillText("x (mm)", pad + plotW - 40, pad + plotH + 18);

    // profile line (to lastIdx)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.moveTo(mapX(x[0]), mapY(z[0]));
    for (let i = 1; i <= lastIdx; i++) {
      ctx.lineTo(mapX(x[i]), mapY(z[i]));
    }
    ctx.stroke();

    drawOverlays(ctx, {
      x,
      zCentered: m.z,
      ra: m.ra,
      highs: m.highs,
      lows: m.lows,
      mapX,
      mapY,
      pad,
      plotW,
      plotH,
      rzFromModel: result.rz,
      showLabels: showFinalMetrics,
    });

    // head of the profilometer
    const hx = mapX(x[lastIdx]);
    const hy = mapY(z[lastIdx]);

    // rail on top
    const railY = pad - 6;
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pad, railY);
    ctx.lineTo(pad + plotW, railY);
    ctx.stroke();

    // carriage (rectangle)
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(hx - 14, railY - 10, 28, 16);

    // stylus (triangle down) + line to profile
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, railY + 6);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.moveTo(hx, railY + 10);
    ctx.lineTo(hx - 6, railY + 22);
    ctx.lineTo(hx + 6, railY + 22);
    ctx.closePath();
    ctx.fill();

    // contact point
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.beginPath();
    ctx.arc(hx, hy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOverlays(ctx, { zCentered, ra, highs, lows, mapY, pad, plotW, rzFromModel, showLabels }) {
    // 1) mean line (z=0)
    const y0 = mapY(0);
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y0);
    ctx.lineTo(pad + plotW, y0);
    ctx.stroke();

    // 2) Ra band: +Ra and -Ra
    const yPlus = mapY(ra);
    const yMinus = mapY(-ra);

    // between -Ra and +Ra
    ctx.fillStyle = "rgba(120,120,120,0.12)";
    const top = Math.min(yPlus, yMinus);
    const h = Math.abs(yPlus - yMinus);
    ctx.fillRect(pad, top, plotW, h);

    // lines ±Ra
    ctx.strokeStyle = "rgba(120,120,120,0.55)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, yPlus);
    ctx.lineTo(pad + plotW, yPlus);
    ctx.moveTo(pad, yMinus);
    ctx.lineTo(pad + plotW, yMinus);
    ctx.stroke();
    ctx.setLineDash([]);

    // text Ra
    if (showLabels) {
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(`+Ra = ${ra.toFixed(2)} µm`, pad - 30, yPlus);
      ctx.fillText(`-Ra = ${ra.toFixed(2)} µm`, pad - 30, yMinus + 10);
    }


    const k = Math.min(highs.length, lows.length);
    const meanHigh = highs.reduce((s,p) => s + zCentered[p.idx], 0) / k;
    const meanLow  = lows.reduce((s,p) => s + zCentered[p.idx], 0) / k; // отрицательное

    const yH = mapY(meanHigh);
    const yL = mapY(meanLow);
    const bx = pad + plotW;

    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(bx, yH);
    ctx.lineTo(bx, yL);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx - 6, yH);
    ctx.lineTo(bx + 6, yH);
    ctx.moveTo(bx - 6, yL);
    ctx.lineTo(bx + 6, yL);
    ctx.stroke();

    if (showLabels) {
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillText(`Rz = ${rzFromModel.toFixed(2)} µm`, bx - 80, yH);
    }
  }

  function startProfileAnimation() {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const profile = profileRef.current;
    const canvas = canvasRef.current;
    if (!profile || !canvas) return;

    if (skipAnimationsRef.current) {
      setIsAnimating(false);
      drawProfileFrame(canvas, profile, 1);
      setShowFinalMetrics(true);
      return;
    }

    const durationMs = scanDurationMs;
    setIsAnimating(true);
    setShowFinalMetrics(false);

    const tick = (now) => {
      const profile = profileRef.current;
      const canvas = canvasRef.current;
      if (!profile || !canvas) return;

      const t = (now - startTimeRef.current) / durationMs;
      const t01 = Math.max(0, Math.min(1, t));

      drawProfileFrame(canvas, profile, t01);

      if (t01 < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        drawProfileFrame(canvas, profile, 1);
        setIsAnimating(false);
        setShowFinalMetrics(true);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }



  function computeMetrics(profile) {
    const z0 = profile?.z;
    if (!z0?.length) return null;

    const n = z0.length;

    // mean line
    const mean = z0.reduce((a, b) => a + b, 0) / n;
    const z = z0.map(v => v - mean);

    // Ra
    const ra = z.reduce((s, v) => s + Math.abs(v), 0) / n;

    // Rz (top5 + bottom5)
    const k = Math.min(5, Math.floor(n / 2));

    // indexes
    const indexed = z.map((val, idx) => ({ val, idx }));
    const highs = [...indexed].sort((a,b) => b.val - a.val).slice(0, k); // max
    const lows  = [...indexed].sort((a,b) => a.val - b.val).slice(0, k); // min

    const meanHigh = highs.reduce((s,p) => s + p.val, 0) / k;
    const meanLowAbs = lows.reduce((s,p) => s + Math.abs(p.val), 0) / k;
    const rz = meanHigh + meanLowAbs;

    return { z, mean, ra, rz, highs, lows };
  }

  return (
      <div className="min-h-screen p-6 md:p-10 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">

          <header className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-600">
              {t.subtitle}
            </p>
          </header>

          <div className="flex gap-2 mb-4">
            <button
                onClick={() => setLang("sk")}
                className={`px-3 py-1 border rounded ${lang === "sk" ? "border-black" : "border-gray-300"}`}
            >
              SK
            </button>

            <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 border rounded ${lang === "en" ? "border-black" : "border-gray-300"}`}
            >
              EN
            </button>
          </div>

          {/* Form */}
          <Card className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600"><b>vc</b> ({t.vc})</div>
                <Input
                    type="number"
                    min={80.68}
                    max={299.32}
                    step="0.01"
                    value={vc}
                    onChange={(e) => setVc(e.target.value)}
                    placeholder={`${t.forexample} 125`}
                    className={!vcOk ? "border-red-500" : ""}
                />
                <div className="text-xs text-gray-500">{t.range} 80.68 - 299.32</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600"><b>ap</b> ({t.ap})</div>
                <Input
                    type="number"
                    min={0.79}
                    max={2.31}
                    step="0.01"
                    value={ap}
                    onChange={(e) => setAp(e.target.value)}
                    placeholder={`${t.forexample} 1.1`}
                    className={!apOk ? "border-red-500" : ""}
                />
                <div className="text-xs text-gray-500">{t.range} 0.79 - 2.31</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600"><b>fn</b> ({t.fn})</div>
                <Input
                    type="number"
                    min={0.1}
                    max={0.39}
                    step="0.01"
                    value={fn}
                    onChange={(e) => setFn(e.target.value)}
                    placeholder={`${t.forexample} 0.16`}
                    className={!fnOk ? "border-red-500" : ""}
                />
                <div className="text-xs text-gray-500">{t.range} 0.10 - 0.39</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <Switch
                  checked={skipAnimations}
                  onCheckedChange={setSkipAnimations}
                  className={skipAnimations ? "bg-green-500 data-[state=checked]:bg-green-500" : "bg-gray-400 data-[state=unchecked]:bg-gray-400"}
              />
              <span className="text-sm font-medium text-gray-700">
      <b>{t.skipAnim}</b>
    </span>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button variant="solid" onClick={onPredict} disabled={loading || !formOk} className="border border-black">
                <b>{t.calculate}</b>
              </Button>



              <Button
                  type="button"
                  onClick={onClear}
                  disabled={loading || (history?.length ?? 0) === 0}
                  className="bg-red-600 text-white hover:bg-red-700"
              >
                {t.clearHistory}
              </Button>
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}
          </Card>




          {result && (
              <Card className="p-5 overflow-hidden">
                <div className="mb-4">
                  <div className="text-lg font-semibold">{t.profilometerS}</div>
                </div>

                <div className="w-full">
                  <div className="profilometer-side-wrap">
                    <div className="profilometer-floor" />



                    <div className="profilometer-surface-shadow" />
                    <div className="profilometer-body-side">
                      <div className="profilometer-top-step main" />
                      <div className="profilometer-top-step small-1" />
                      <div className="profilometer-top-step small-2" />
                      <div className="profilometer-top-step accent" />
                      <div className="profilometer-bottom-strip" />
                      <div className="profilometer-foot left" />
                      <div className="profilometer-foot right" />
                    </div>

                    <div className="probe-mount" />

                    <div
                        className="probe-head-wrap"
                        key={scanTick}
                        style={
                          profile && !runWithoutAnimation
                              ? {
                                animation: probeAnimation,
                                "--probe-travel": `-${probeTravelPx}px`,
                              }
                              : undefined
                        }
                    >
                      <div className="probe-head-bar" />
                      <div className="probe-head-block" />
                      <div className="probe-head-tip" />
                      <div className="probe-head-needle" />
                      <div className="probe-red-dot" />
                      <div className="probe-support" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                      type="button"
                      onClick={() => setShowProfilometerDescription((v) => !v)}
                      className="text-sm font-medium px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    {showProfilometerDescription ? t.hideDescription : t.showDescription}
                  </button>

                  {showProfilometerDescription && (
                      <div className="mt-3 rounded-xl border bg-gray-50 p-4 space-y-2 text-sm text-gray-700 leading-6">
                        <div className="font-semibold text-gray-900">{t.profilometerDescTitle}</div>
                        <p>{t.profilometerDesc1}</p>
                        <p>{t.profilometerDesc2}</p>
                        <p>{t.profilometerDesc3}</p>
                      </div>
                  )}
                </div>
              </Card>
          )}


          {result && profile && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">
                    {t.roughnessG}
                  </div>
                  <div className="text-sm text-gray-500">
                    N={profile.x?.length ?? 0}
                  </div>
                </div>
                <div className="w-full">
                  <canvas ref={canvasRef} />
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <button
                        type="button"
                        onClick={() => setShowGraphDescription((v) => !v)}
                        className="text-sm font-medium px-3 py-1.5 border rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      {showGraphDescription ? t.hideDescription : t.showDescription}
                    </button>

                    {showGraphDescription && (
                        <div className="mt-3 rounded-xl border bg-gray-50 p-4 space-y-2 text-sm text-gray-700 leading-6">
                          <div className="font-semibold text-gray-900">{t.graphDescTitle}</div>
                          <p>{t.graphDesc1}</p>
                          <p>{t.graphDesc2}</p>
                          <p>{t.graphDesc3}</p>
                          <p>{t.graphDesc4}</p>
                        </div>
                    )}
                  </div>
                </div>
              </Card>
          )}

          {/* Result cards */}
          {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5">
                  <div className="text-sm text-gray-600">Ra</div>
                  <div className="text-3xl font-bold">
                    {showFinalMetrics ? Number(result.ra).toFixed(3) : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {t.time}: {result.timestamp}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="text-sm text-gray-600">Rz</div>
                  <div className="text-3xl font-bold">
                    {showFinalMetrics ? Number(result.rz).toFixed(3) : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    vc={result.vc}, ap={result.ap}, fn={result.fn}, {t.distribution}={String(result.add_noise)}
                  </div>
                </Card>
              </div>
          )}

          {/* History */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t.history}</h2>
              <div className="text-sm text-gray-500">{t.logs}: {history.length}</div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-600">
                <tr className="border-b">
                  <th className="py-2 pr-2">{t.time}</th>
                  <th className="py-2 pr-2">vc</th>
                  <th className="py-2 pr-2">ap</th>
                  <th className="py-2 pr-2">fn</th>
                  <th className="py-2 pr-2">Ra</th>
                  <th className="py-2 pr-2">Rz</th>
                </tr>
                </thead>
                <tbody>
                {history.map((h, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="py-2 pr-2">{h.timestamp}</td>
                      <td className="py-2 pr-2">{h.vc}</td>
                      <td className="py-2 pr-2">{h.ap}</td>
                      <td className="py-2 pr-2">{h.fn}</td>
                      <td className="py-2 pr-2">{Number(h.ra).toFixed(3)}</td>
                      <td className="py-2 pr-2">{Number(h.rz).toFixed(3)}</td>
                    </tr>
                ))}
                {history.length === 0 && (
                    <tr>
                      <td className="py-3 text-gray-500" colSpan="7">
                        Empty
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
        <style jsx>{`
  .profilometer-side-wrap {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: hidden;
    background: #f9f9f9;
  }

  .profilometer-floor {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 18px;
    height: 32px;
    background: #cfcfcf;
    z-index: 1;
  }

  .profilometer-surface-shadow {
    position: absolute;
    left: 36px;
    bottom: 40px;
    width: 165px;
    height: 10px;
    background: #bdbdbd;
    z-index: 2;
  }

  .profilometer-surface {
    position: absolute;
    left: 18px;
    bottom: 36px;
    width: 170px;
    height: 56px;
    background: #d9d9d9;
    z-index: 3;
  }

  .profilometer-body-side {
    position: absolute;
    left: 235px;
    top: 36px;
    width: calc(100% - 245px);
    height: 205px;
    background: #6b6b6b;
    border: none;
    border-radius: 0 34px 8px 0;
    box-shadow:
      inset -4px 0 0 rgba(0,0,0,0.18),
      inset 0 -2px 0 rgba(255,255,255,0.08);
    z-index: 7;
  }

  .profilometer-body-side::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 34px;
    height: 34px;
    background: #f9f9f9;
    clip-path: polygon(0 0, 100% 0, 0 100%);
    z-index: 2;
    border: none;
    box-shadow: none;
  }

  .profilometer-top-step {
    position: absolute;
    top: -4px;
    height: 4px;
    background: #4d4d4d;
    z-index: 9;
  }

  .profilometer-top-step.main {
    left: 52px;
    width: 240px;
  }

  .profilometer-top-step.small-1 {
    left: 320px;
    width: 66px;
    background: #111;
  }

  .profilometer-top-step.small-2 {
    left: 418px;
    width: 66px;
    background: #111;
  }

  .profilometer-top-step.accent {
    left: 518px;
    width: 68px;
    background: #d30000;
  }

  .profilometer-bottom-strip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 16px;
    background: #202020;
    z-index: 8;
  }

  .profilometer-foot {
    position: absolute;
    bottom: -10px;
    width: 26px;
    height: 18px;
    background: #111;
    border-radius: 0 0 5px 5px;
    z-index: 6;
  }

  .profilometer-foot.left {
    left: 20px;
  }

  .profilometer-foot.right {
    right: 14px;
  }

  .probe-mount {
    position: absolute;
    left: 220px;
    top: 156px;
    width: 16px;
    height: 0px;
    background: #5a5a5a;
    border-left: 2px solid #444;
    border-right: 2px solid #444;
    z-index: 6;
  }

  .probe-head-wrap {
    position: absolute;
    left: 118px;
    top: 205px;
    width: 108px;
    height: 38px;
    z-index: 4;
  }



  .probe-head-bar {
    position: absolute;
    left: 0;
    top: 10px;
    width: 200px;
    height: 15px;
    background: linear-gradient(to bottom, #bdbdbd, #8d8d8d);
    border-top: 1px solid #9a9a9a;
    border-left: 1px solid #9a9a9a;
    border-bottom: 1px solid #6f6f6f;
  }

  .probe-head-block {
    position: absolute;
    left: 100px;
    top: 5px;
    width: 60px;
    height: 24px;
    background: #5d5d5d;
    border-left: 2px solid #464646;
  }

  .probe-head-tip {
    position: absolute;
    left: 0px;
    top: 24px;
    width: 22px;
    height: 13px;
    background: #666;
    border-right: 1px solid #9a9a9a;
    border-left: 1px solid #9a9a9a;
  }

  .probe-head-needle {
    position: absolute;
    left: 11px;
    top: 37px;
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 9px solid #777;
  }

  .probe-red-dot {
    position: absolute;
    right: -2px;
    top: 2px;
    width: 5px;
    height: 5px;
    background: #e00000;
    border-radius: 50%;
    z-index: 8;
  }

  .probe-support {
    position: absolute;
    left: 0px;
    top: 37px;
    width: 8px;
    height: 8px;
    background: #ff8c00;
    border-radius: 0 0 3px 3px;
    z-index: 3;
  }

  @keyframes probeSideMove {
    0% {
      transform: translateX(0);
    }
    50% {
    transform: translateX(-42px);
    }
    100% {
    transform: translateX(0);
    }
  }

  @media (max-width: 900px) {
    .profilometer-side-wrap {
      height: 220px;
    }

    .profilometer-floor {
      bottom: 14px;
      height: 24px;
    }

    .profilometer-surface-shadow {
      left: 24px;
      bottom: 28px;
      width: 112px;
      height: 8px;
    }

    .profilometer-surface {
      left: 12px;
      bottom: 30px;
      width: 118px;
      height: 40px;
    }

    .profilometer-body-side {
      left: 155px;
      top: 28px;
      width: calc(100% - 162px);
      height: 145px;
      border-radius: 0 24px 6px 0;
    }

    .profilometer-top-step.main {
      left: 34px;
      width: 150px;
    }

    .profilometer-top-step.small-1 {
      left: 202px;
      width: 44px;
    }

    .profilometer-top-step.small-2 {
      left: 264px;
      width: 44px;
    }

    .profilometer-top-step.accent {
      left: 326px;
      width: 46px;
    }

    .profilometer-bottom-strip {
      height: 11px;
    }

    .profilometer-foot {
      width: 18px;
      height: 12px;
      bottom: -7px;
    }

    .probe-mount {
      left: 144px;
      top: 112px;
      width: 12px;
      height: 30px;
    }

    .probe-head-wrap {
      left: 50px;
      top: 128px;
      width: 76px;
      height: 28px;
    }

    .probe-head-bar {
      width: 54px;
      height: 7px;
      top: 9px;
    }

    .probe-head-block {
      width: 10px;
      height: 18px;
      top: 3px;
    }

    .probe-head-tip {
      width: 15px;
      height: 6px;
      top: 14px;
    }

    .probe-head-needle {
      left: 7px;
      top: 19px;
      border-left: 3px solid transparent;
      border-right: 3px solid transparent;
      border-top: 7px solid #777;
    }



    @keyframes probeSideMoveMobile {
      0% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(-26px);
      }
      100% {
        transform: translateX(0);
      }
    }
  }
`}</style>
      </div>
  );
}