"use client";

import { FormEvent, useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) { setError(result.error ?? "Přihlášení se nepodařilo."); return; }
    window.location.reload();
  }

  return <main className="admin-login"><div className="admin-login-card"><p className="eyebrow"><span /> velitelský tábor</p><h1>Vstup do<br /><i>administrace.</i></h1><p>Správa výzev, bodů a celé výpravy na jednom místě.</p><form onSubmit={submit}><label htmlFor="admin-password">Heslo správce</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><button type="submit" disabled={loading}>{loading ? "Ověřuji…" : "Vstoupit do administrace"}</button>{error && <small>{error}</small>}</form></div></main>;
}
