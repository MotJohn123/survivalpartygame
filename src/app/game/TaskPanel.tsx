"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

interface Task {
  id: number;
  taskCode: string;
  taskText: string;
  taskPoints: number;
  isPublicQuest: boolean;
}

interface TaskPanelProps {
  initialCode?: string;
  initialPoints: number;
}

export default function TaskPanel({ initialCode = "", initialPoints }: TaskPanelProps) {
  const [code, setCode] = useState(initialCode);
  const [task, setTask] = useState<Task | null>(null);
  const [points, setPoints] = useState(initialPoints);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const lookupTask = useCallback(async (value: string) => {
    const normalizedCode = value.trim().toUpperCase();
    if (!normalizedCode) return;
    setCode(normalizedCode);
    setTask(null);
    setError("");
    setMessage("");
    setLoading(true);
    const response = await fetch(`/api/tasks/lookup?code=${encodeURIComponent(normalizedCode)}`);
    const result = await response.json().catch(() => ({ error: "Úkol se nepodařilo načíst." }));
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Úkol se nepodařilo najít.");
      return;
    }
    setTask(result.task);
  }, []);

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookupTask(code);
  }

  async function completeTask() {
    if (!task) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskCode: task.taskCode }),
    });
    const result = await response.json().catch(() => ({ error: "Úkol se nepodařilo dokončit." }));
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Úkol se nepodařilo dokončit.");
      return;
    }
    setPoints(result.points);
    setTask(null);
    setMessage(result.publicQuest ? "Úkol splněn. Teď můžeš darovat jeho body někomu z kmene." : `Výborně. Připsáno +${result.pointsAwarded} bodů.`);
  }

  useEffect(() => {
    if (!initialCode) return;
    const normalizedCode = initialCode.trim().toUpperCase();
    void fetch(`/api/tasks/lookup?code=${encodeURIComponent(normalizedCode)}`)
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!response.ok) {
          setError(result.error ?? "Úkol se nepodařilo najít.");
          return;
        }
        setCode(normalizedCode);
        setTask(result.task);
      });
  }, [initialCode, lookupTask]);

  useEffect(() => {
    if (!scanning) return;
    let scanner: import("html5-qrcode").Html5Qrcode | undefined;
    let cancelled = false;

    void import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      scanner = new Html5Qrcode("task-qr-reader");
      const cameras = await Html5Qrcode.getCameras();
      const camera = cameras.find((item) => /back|rear|environment/i.test(item.label)) ?? cameras[0];
      if (!camera) throw new Error("camera-not-found");
      let handled = false;
      void scanner.start(camera.id, { fps: 10, qrbox: { width: 220, height: 220 } }, async (decodedText) => {
        if (handled) return;
        handled = true;
        try { await scanner?.stop(); } catch {}
        try { await scanner?.clear(); } catch {}
        setScanning(false);
        const decodedCode = (() => { try { return new URL(decodedText, window.location.origin).searchParams.get("code") ?? decodedText; } catch { return decodedText; } })();
        await lookupTask(decodedCode);
      }, () => undefined).catch(() => setError("Kameru se nepodařilo spustit. Povol fotoaparát v prohlížeči a zkus to znovu."));
    });

    return () => {
      cancelled = true;
      void scanner?.stop().catch(() => undefined);
    };
  }, [lookupTask, scanning]);

  return (
    <section className="task-panel">
      <div className="task-panel-heading"><div><p className="eyebrow"><span /> další stopa</p><h2>Najdi svůj<br /><i>úkol.</i></h2></div><div className="task-points"><strong>{points}</strong><span>body</span></div></div>
      <form className="task-form" onSubmit={submitCode}><label htmlFor="task-code">Zadej kód úkolu</label><div className="task-input-row"><input id="task-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="např. OHEN" /><button type="submit" disabled={loading}>{loading ? "Hledám…" : "Ověřit"}</button></div><button className="scan-button" type="button" onClick={() => { setError(""); setMessage(""); setScanning(true); }}>◉ {scanning ? "Skenuji…" : "Naskenovat QR"}</button></form>
      {scanning && <div className="qr-reader-wrap"><div id="task-qr-reader" /><button type="button" className="cancel-button" onClick={() => setScanning(false)}>Zavřít kameru</button></div>}
      {error && <p className="task-error">{error}</p>}
      {message && <p className="task-success">{message}</p>}
      {task && <div className="task-reveal"><p className="task-code">Kód {task.taskCode}</p><h3>{task.taskText}</h3><p className="task-reward">Odměna <b>+{task.taskPoints} bodů</b>{task.isPublicQuest && " · veřejný úkol"}</p><div className="task-actions"><button type="button" className="complete-button" onClick={completeTask} disabled={loading}>{loading ? "Zapisuji…" : "Splnil/a jsem"}</button><button type="button" className="cancel-button" onClick={() => setTask(null)}>Zrušit</button></div></div>}
    </section>
  );
}
