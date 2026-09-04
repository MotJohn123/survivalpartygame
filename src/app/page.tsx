"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function enterGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) { setError(result.error ?? "Vstup se nepodařil."); return; }
    router.push("/game");
  }

  return (
    <main className="party-home">
      <nav className="party-nav">
        <a className="brand" href="#top"><span className="brand-mark">✦</span><span>Survival <em>Party</em></span></a>
        <div className="party-nav-actions"><a href="#login">Přihlášení</a><a className="admin-link" href="/admin">Administrace <span>↗</span></a></div>
      </nav>

      <section className="party-hero" id="top">
        <div className="party-hero-copy">
          <p className="eyebrow"><span /> hra pro celou partu</p>
          <h1>Survival<br /><i>Party.</i></h1>
          <p className="party-lead">Výzvy, body, aliance a historky, na které se bude vzpomínat ještě dlouho po víkendu.</p>
          <a className="party-scroll" href="#live"><span>↓</span> Co se děje ve hře</a>
        </div>
        <div className="party-stage" aria-label="Ilustrace party u táborového ohně">
          <div className="party-sun" /><div className="party-horizon" /><div className="party-shape shape-one" /><div className="party-shape shape-two" />
          <div className="party-people"><span /><span /><span /><span /><span /></div>
          <div className="party-fire"><i /><i /><i /><b /></div>
          <p><b>01</b> Jedna parta.<br />Nekonečně příběhů.</p>
        </div>
      </section>

      <section className="party-login" id="login">
        <div><p className="eyebrow"><span /> přidej se k ostatním</p><h2>Jak ti<br /><i>říkají?</i></h2></div>
        <form className="party-entry-form" onSubmit={enterGame}><label htmlFor="name">Tvoje jméno</label><div><input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Napiš jméno nebo přezdívku" autoComplete="nickname" /><button type="submit" disabled={loading}>{loading ? "Vstupuji…" : "Vstoupit do hry →"}</button></div>{error && <p className="error-message">{error}</p>}</form>
      </section>

      <section className="party-live" id="live">
        <div className="party-section-heading"><p className="eyebrow"><span /> živě z tábora</p><h2>Buď<br /><i>u toho.</i></h2></div>
        <div className="party-links"><a className="party-link-card dashboard-card" href="/dashboard"><span className="card-number">01</span><div><strong>Nástěnka</strong><small>Novinky, momentky<br />a zprávy z party</small></div><b>↗</b></a><a className="party-link-card leaderboard-card" href="/leaderboard"><span className="card-number">02</span><div><strong>Žebříček</strong><small>Kdo vede? Kdo<br />stoupá vzhůru?</small></div><b>↗</b></a></div>
      </section>

      <footer className="party-footer"><span>Survival Party</span><span>Hra pro přátele · 2026</span></footer>
    </main>
  );
}
