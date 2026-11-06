"use client";

import { useEffect, useState } from "react";
import { startGuestSession } from "@/app/actions";

export function GuestModeButton({ en, returnTo }: { en: boolean; returnTo: string }) {
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    const key = "karta_guest_device_id";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(key, id);
    }
    setDeviceId(id);
  }, []);
  return <form action={startGuestSession} style={{ marginTop: 12 }}>
    <input type="hidden" name="deviceId" value={deviceId} />
    <input type="hidden" name="returnTo" value={returnTo} />
    <button type="submit" disabled={!deviceId} style={{ width: "100%", minHeight: 48, padding: 13, border: "1px solid rgba(186,200,255,.42)", borderRadius: 14, background: "rgba(255,255,255,.38)", color: "rgba(26,32,80,.62)", fontSize: 14, fontWeight: 600, opacity: deviceId ? 1 : .55 }}>{en ? "Continue without an account" : "Продолжить без аккаунта"}</button>
  </form>;
}
