"use client";

import { deleteAccountData } from "./actions";

export function DeleteDataForm({ en = false }: { en?: boolean }) {
  return <form action={deleteAccountData} onSubmit={(event) => {
    const message = en
      ? "Your profile, city history, vaccinations, medications, lab results, and email sign-in will be permanently deleted. Your ChatGPT account will remain. Continue?"
      : "Профиль, история городов, прививки, лекарства, анализы и вход через email будут удалены без возможности восстановления. Аккаунт ChatGPT останется. Продолжить?";
    if (!window.confirm(message)) event.preventDefault();
  }}>
    <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 10, background: "#FFF5F5", border: "1px solid #FFD8D8", color: "#C92A2A", fontWeight: 700 }}>{en ? "Delete Karta data" : "Удалить данные Karta"}</button>
    <div style={{ fontSize: 10, color: "rgba(26,32,80,0.42)", marginTop: 5 }}>{en ? "Your profile, cities, vaccinations, medications, lab results, and email sign-in will be deleted. Your ChatGPT account will remain." : "Удалятся профиль, города, прививки, лекарства, анализы и email-вход. Аккаунт ChatGPT останется."}</div>
  </form>;
}
