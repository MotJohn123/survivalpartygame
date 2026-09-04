"use client";

import { ChangeEvent, useState } from "react";
import Image from "next/image";

export default function PhotoUpload({ currentPhoto }: { currentPhoto: string | null }) {
  const [photo, setPhoto] = useState(currentPhoto);
  const [status, setStatus] = useState("");
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("Nahrávám…");
    const formData = new FormData(); formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok) { setStatus(result.error ?? "Nahrání se nepodařilo."); return; }
    setPhoto(result.url); setStatus("Fotka uložena.");
  }
  return <div className="photo-upload"><div className="profile-avatar">{photo ? <Image src={photo} alt="Profilová fotka" width={58} height={58} unoptimized /> : "✦"}</div><label>Upravit fotku<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>{status && <small>{status}</small>}</div>;
}
