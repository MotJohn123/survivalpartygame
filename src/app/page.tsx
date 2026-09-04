"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function enterGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!name.trim()) return;
    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "Vstup se nepodařil.");
      return;
    }
    setEntered(true);
    router.push("/game");
  }

  return (
    <main className="site-shell">
      <nav className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">✦</span><span>Survival <em>Party</em></span></a>
        <div className="top-links"><a href="#pravidla">Jak to funguje</a><a href="/leaderboard">Žebříček</a><a className="admin-link" href="/admin">Administrace <span>↗</span></a></div>
      </nav>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> víkendová výprava 2026</p>
          <h1>Vstup do<br /><i>divočiny.</i></h1>
          <p className="hero-text">Výzvy, odvaha a trochu zdravé rivality. Tvoje mise začíná právě teď.</p>
          <form className="entry-form" onSubmit={enterGame}><label htmlFor="name">Tvoje jméno</label><div className="input-row"><input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jak ti říkají?" autoComplete="nickname" /><button type="submit" disabled={loading}>{loading ? "Vstupuji…" : <>Vstoupit <span>→</span></>}</button></div>{entered && <p className="success-message">Vítej v kmeni, {name.trim()}.</p>}{error && <p className="error-message">{error}</p>}</form>
          <div className="quick-links"><a href="#pravidla"><span className="round-icon">?</span> Co mě čeká?</a><a href="/dashboard"><span className="round-icon">↗</span> Nástěnka</a></div>
        </div>
        <div className="hero-art" aria-label="Ilustrace táborového ohně v džungli"><div className="sun" /><div className="moon-line" /><div className="mountain mountain-back" /><div className="mountain mountain-front" /><div className="palm palm-left"><span /><b /><i /></div><div className="palm palm-right"><span /><b /><i /></div><div className="fire"><span className="flame flame-one" /><span className="flame flame-two" /><span className="flame flame-three" /><div className="logs" /></div><div className="art-caption"><span>01</span><p>Najdi svou<br />sílu</p></div></div>
      </section>
      <section className="stats-strip" id="pravidla"><div><strong>03</strong><span>kmeny</span></div><div><strong>24</strong><span>hráčů</span></div><div><strong>∞</strong><span>výzev</span></div><p>Každý bod se počítá.</p></section>
      <section className="lower-section" id="zebricek"><div><p className="eyebrow"><span /> průvodce výpravou</p><h2>Hra začíná<br /><i>mimo komfort.</i></h2></div><div className="feature-list"><article><span>01</span><div><h3>Plň výzvy</h3><p>Každý úkol odemyká nové body a nové příběhy.</p></div></article><article><span>02</span><div><h3>Drž svůj kmen</h3><p>Spolupráce rozhoduje. Nebo možná právě naopak.</p></div></article><article><span>03</span><div><h3>Stoupej výš</h3><p>Žebříček se mění každou minutou. Buď u toho.</p></div></article></div></section>
      <footer><span>Survival Party</span><span>Hra pro přátele · 2026</span></footer>
    </main>
  );
}
