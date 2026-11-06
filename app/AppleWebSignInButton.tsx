"use client";

import { useState } from "react";
import { loginWithApple } from "@/app/actions";

declare global {
  interface Window {
    AppleID?: { auth: { init(options: Record<string, unknown>): void; signIn(): Promise<{ authorization?: { id_token?: string }; user?: { name?: { firstName?: string; lastName?: string } } }> } };
  }
}

export function AppleWebSignInButton({ clientId, returnTo, en }: { clientId: string; returnTo: string; en: boolean }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function signIn() {
    if (!clientId || !window.AppleID) {
      setError(en ? "Apple sign-in for the web needs to be configured." : "Вход через Apple в браузере ещё не настроен.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      window.AppleID.auth.init({ clientId, scope: "name email", redirectURI: `${window.location.origin}/auth/apple/callback`, usePopup: true });
      const response = await window.AppleID.auth.signIn();
      const identityToken = response.authorization?.id_token;
      if (!identityToken) throw new Error("Apple did not return an identity token.");
      const fullName = [response.user?.name?.firstName, response.user?.name?.lastName].filter(Boolean).join(" ");
      const formData = new FormData();
      formData.set("identityToken", identityToken);
      formData.set("fullName", fullName);
      formData.set("returnTo", returnTo);
      await loginWithApple(formData);
    } catch {
      setError(en ? "Apple sign-in failed. Please try again." : "Не удалось войти через Apple. Попробуйте ещё раз.");
      setLoading(false);
    }
  }
  return <>
    <button type="button" onClick={signIn} disabled={loading} style={{ width: "100%", minHeight: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 12, border: "1px solid rgba(255,255,255,.9)", borderRadius: 14, background: "rgba(255,255,255,.72)", color: "#1A2050", fontSize: 15, fontWeight: 650, opacity: loading ? .65 : 1 }}><span style={{ fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif", fontSize: 21, lineHeight: 1 }}></span>{loading ? (en ? "Signing in…" : "Входим…") : (en ? "Sign in with Apple" : "Войти через Apple")}</button>
    {error && <div role="status" style={{ marginTop: 8, color: "rgba(26,32,80,.58)", fontSize: 11, textAlign: "center" }}>{error}</div>}
  </>;
}
