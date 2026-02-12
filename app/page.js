"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const API = "";


export default function Home() {
  const [vc, setVc] = useState("");
  const [ap, setAp] = useState("");
  const [fn, setFn] = useState("");
  const [addNoise, setAddNoise] = useState(true);

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const vcNum = Number(vc);
  const apNum = Number(ap);
  const fnNum = Number(fn);

  const vcOk = vc.trim() !== "" && Number.isFinite(vcNum);
  const apOk = ap.trim() !== "" && Number.isFinite(apNum);
  const fnOk = fn.trim() !== "" && Number.isFinite(fnNum);

const formOk = vcOk && apOk && fnOk;
  async function loadHistory() {
    try {
      const r = await fetch("/api/measurements", {
        cache: "no-store",
      });
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

  async function onPredict() {
    if(!formOk) {
      setErr("Заполни vc, ap, fn (только числа).");
      return;
    }

    setErr("");
    setLoading(true);
    setResult(null);

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
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `HTTP ${r.status}`);
      }

      const data = await r.json();
      setResult(data);
      await loadHistory();
    } catch (e) {
      setErr(`Request error: ${e?.message || "unknown"}`);

    } finally {
      setLoading(false);
    }
  }

  async function onClear() {
    setErr("");
    try {
      console.log("SENDING DELETE", `${API}/measurements`);
      const r = await fetch("/api/measurements", { method: "DELETE" });
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

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">

        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Virtuálny Drsnomer</h1>
          <p className="text-gray-600">
            Zadať parametre rezania → predikcia drsnosti <b>Ra</b> a <b>Rz</b>
          </p>
        </header>

        {/* Form */}
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600"><b>vc</b> (rezná rýchlosť)</div>
              <Input value={vc} onChange={(e) => setVc(e.target.value)} placeholder="Napríklad 125" className={!vcOk ? "border-red-500" : ""}/>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600"><b>ap</b> (hĺbka rezu)</div>
              <Input value={ap} onChange={(e) => setAp(e.target.value)} placeholder="Napríklad 1.1" className={!apOk ? "border-red-500" : ""}/>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600"><b>fn</b> (posuv)</div>
              <Input value={fn} onChange={(e) => setFn(e.target.value)} placeholder="Napríklad 0.16" className={!fnOk ? "border-red-500" : ""}/>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={addNoise}
              onCheckedChange={setAddNoise}
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
            />
            <span className="text-sm text-gray-700">
              Normálne rozdelenie
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-md border ${
                addNoise
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {String(addNoise)}
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="solid" onClick={onPredict} disabled={loading || !formOk}>
              <b>Vypočítať</b>
            </Button>
            <Button variant="outline" onClick={loadHistory}>
              Obnoviť históriu
            </Button>
            <Button
              type = "button"
              onClick={onClear}
              disabled={loading || (history?.length ?? 0) === 0}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Vymazať históriu
            </Button>
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}
        </Card>

        {/* Result cards */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="text-sm text-gray-600">Ra</div>
              <div className="text-3xl font-bold">{Number(result.ra).toFixed(3)}</div>
              <div className="text-xs text-gray-500 mt-2">
                čas: {result.timestamp}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-sm text-gray-600">Rz</div>
              <div className="text-3xl font-bold">{Number(result.rz).toFixed(3)}</div>
              <div className="text-xs text-gray-500 mt-2">
                vc={result.vc}, ap={result.ap}, fn={result.fn}, rozdelenie={String(result.add_noise)}
              </div>
            </Card>
          </div>
        )}

        {/* History */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">História</h2>
            <div className="text-sm text-gray-500">Záznamy: {history.length}</div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr className="border-b">
                  <th className="py-2 pr-2">Čas</th>
                  <th className="py-2 pr-2">vc</th>
                  <th className="py-2 pr-2">ap</th>
                  <th className="py-2 pr-2">fn</th>
                  <th className="py-2 pr-2">Ra</th>
                  <th className="py-2 pr-2">Rz</th>
                  <th className="py-2 pr-2">rozdelenie</th>
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
                    <td className="py-2 pr-2">{String(h.add_noise)}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan="7">
                      Zatiaľ žiadne vypočty
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}