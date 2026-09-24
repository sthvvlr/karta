"use client";

import { useEffect, useState } from "react";
import catalog from "./vaccinations_catalog.json";
import facts from "./health_facts.json";
import medicines from "./medications_ru.json";
import rules from "./monitoring_rules.json";

type Language = "ru" | "en";
type Pair = [string, string];

const pairs: Pair[] = [
  ["Главная", "Home"], ["Прививки", "Vaccinations"], ["Лекарства", "Medications"], ["Профиль", "Profile"], ["Анализы", "Lab tests"], ["Чекапы", "Check-ups"],
  ["Карта здоровья", "Health card"], ["Ваша карта прививок, лекарств и анализов в одном месте.", "Your vaccinations, medications and lab tests in one place."],
  ["Паспорт вакцинации и персональные рекомендации", "Vaccination record and personal recommendations"], ["Личные данные, регионы и настройки", "Personal data, regions and settings"],
  ["Имя", "Name"], ["Дата рождения", "Date of birth"], ["Пол", "Gender"], ["Не указан", "Not specified"], ["Женский", "Female"], ["Мужской", "Male"], ["Другой", "Other"],
  ["Текущий город", "Current city"], ["Начните вводить город", "Start typing a city"], ["Поиск…", "Searching…"], ["Сохранить профиль", "Save profile"], ["Регион влияет на каталог и рекомендации по прививкам.", "Your region affects the vaccine catalogue and recommendations."],
  ["История городов", "City history"], ["Добавьте города, где жили раньше, чтобы учитывать региональные риски.", "Add places where you lived before to account for regional risks."], ["Добавить город", "Add city"], ["С какого года", "From year"], ["По какой год", "To year"], ["текущий", "current"], ["Сделать текущим", "Make current"], ["Удалить", "Delete"],
  ["Напоминания", "Reminders"], ["Напоминания о лекарствах включены", "Medication reminders are enabled"], ["Утро", "Morning"], ["Вечер", "Evening"], ["Сохранить настройки", "Save settings"], ["Разрешить уведомления браузера", "Allow browser notifications"], ["Браузер не поддерживает уведомления", "This browser does not support notifications"], ["Уведомления разрешены", "Notifications allowed"], ["Разрешение не выдано", "Permission was not granted"], ["Настройки сохраняются в базе Karta и доступны на других устройствах.", "Settings are saved in the Karta database and available on other devices."],
  ["Аккаунт", "Account"], ["Выйти через ChatGPT", "Sign out of ChatGPT"], ["Выйти из email-аккаунта", "Sign out of email account"], ["Изменить пароль", "Change password"], ["Новый пароль, минимум 6 символов", "New password, at least 6 characters"], ["Сохранить новый пароль", "Save new password"], ["Удалить данные Karta", "Delete Karta data"], ["Удалит карту, лекарства, прививки и анализы из базы. Аккаунт ChatGPT не удаляется.", "This deletes your health card, medications, vaccinations and lab tests from the database. Your ChatGPT account is not deleted."],
  ["Рекомендовано для вас", "Recommended for you"], ["Предстоящие прививки", "Upcoming vaccinations"], ["Предстоящих доз пока нет.", "There are no upcoming doses."], ["Отметить", "Mark done"], ["Сохранить выполненную дозу", "Save completed dose"], ["Препарат / бренд", "Product / brand"], ["Клиника", "Clinic"], ["Моя история", "My history"], ["Пока нет записей. Добавьте первую прививку ниже.", "No records yet. Add your first vaccination below."], ["Изменить", "Edit"], ["Сохранить изменения", "Save changes"], ["Удалить запись", "Delete record"], ["+ Добавить прививку", "+ Add vaccination"], ["Выберите вакцину", "Choose a vaccine"], ["Номер дозы", "Dose number"], ["Заметки", "Notes"],
  ["Лекарства сегодня", "Medications today"], ["Задачи на сегодня", "Today’s tasks"], ["Приём сегодня", "Today’s doses"], ["Все задачи →", "All tasks →"], ["Сегодня", "Today"], ["Отмечайте каждый отдельный приём", "Mark each dose as you take it"], ["Все задачи на сегодня выполнены 🎉", "All tasks for today are complete 🎉"], ["Нет запланированных приёмов на сегодня", "No doses scheduled for today"], ["Напоминания курса", "Course monitoring"], ["Что проверить", "What to check"], ["Отметить выполненным", "Mark complete"], ["Мои препараты", "My medications"], ["активно", "active"], ["Изменить или удалить", "Edit or delete"], ["Удалить лекарство", "Delete medication"], ["+ Добавить лекарство", "+ Add medication"], ["Пока нет лекарств. Добавьте препарат ниже.", "No medications yet. Add one below."], ["Начните вводить название", "Start typing a name"], ["Дозировка", "Dosage"], ["Неважно", "Any"], ["До еды", "Before food"], ["Во время еды", "With food"], ["После еды", "After food"], ["Сохранить лекарство", "Save medication"], ["По необходимости", "As needed"], ["Несколько раз в неделю", "Several times a week"], ["Каждый день", "Every day"],
  ["Анализы", "Lab tests"], ["Добавить анализ", "Add lab test"], ["Новый анализ", "New lab test"], ["Показатель", "Indicator"], ["Результат", "Result"], ["Единица", "Unit"], ["Референсный диапазон", "Reference range"], ["Дата анализа", "Test date"], ["Добавить показатель", "Add indicator"], ["Сохранить анализ", "Save lab test"], ["Пока нет анализов.", "No lab tests yet."], ["Удалить анализ", "Delete lab test"], ["Открыть файл", "Open file"], ["Примечания", "Notes"],
  ["Интересный факт", "Interesting fact"], ["Прогресс профиля", "Profile progress"], ["Подробнее о Karta Score", "More about Karta Score"], ["Добавьте дату рождения, город и записи, чтобы карта была полезнее.", "Add your birth date, city and records to make your card more useful."], ["Профиль заполнен — можно пользоваться картой.", "Your profile is complete — your card is ready to use."], ["Моя карта здоровья", "My health card"], ["Открыть и сохранить в PDF", "Open and save as PDF"], ["Разделы", "Sections"], ["Скоро", "Coming soon"], ["Добавьте первое лекарство", "Add your first medication"], ["Вы принимаете лекарства?", "Do you take medications?"], ["Да, добавить →", "Yes, add one →"],
  ["KARTA · НАСТРОЙКА ПРОФИЛЯ", "KARTA · PROFILE SETUP"], ["Давайте настроим вашу карту", "Let’s set up your card"], ["Это займёт около минуты и улучшит рекомендации по прививкам.", "It takes about a minute and improves your vaccination recommendations."], ["Продолжить", "Continue"],
  ["Войдите, чтобы открыть карту.", "Sign in to open your card."], ["Войдите в Karta, чтобы открыть профиль.", "Sign in to open your profile."], ["Войдите через ChatGPT, чтобы выгрузить карту.", "Sign in with ChatGPT to export your card."], ["Войти через ChatGPT", "Sign in with ChatGPT"], ["Войти по email", "Sign in with email"], ["Создать аккаунт", "Create account"], ["Email", "Email"], ["Пароль", "Password"], ["Имя", "Name"], ["Пароль (минимум 6 символов)", "Password (at least 6 characters)"], ["Моя карта здоровья", "My health card"], ["Вернуться в Karta", "Back to Karta"],
  ["Печать / сохранить PDF", "Print / save PDF"], ["Скачать PDF-файл", "Download PDF file"], ["Закрыть", "Close"],
  ["Записей", "Records"], ["Доз", "Doses"], ["KARTA SCORE", "KARTA SCORE"], ["Дата не указана", "Date not specified"], ["Добавьте дату рождения в профиле", "Add your birth date in Profile"], ["Укажите город в профиле — региональные рекомендации станут точнее.", "Add your city in Profile for more accurate regional recommendations."], ["Все подходящие записи уже добавлены или данных профиля недостаточно.", "All matching records are already added or more profile data is needed."], ["По назначению врача", "As prescribed by a doctor"], ["Кому:", "For:"], ["Важно:", "Important:"], ["Примечание:", "Note:"], ["Беременность:", "Pregnancy:"], ["Если рядом младенец:", "If there is an infant nearby:"], ["Путешествия", "Travel"], ["Просрочено", "Overdue"], ["Запланировано", "Scheduled"], ["Готово", "Done"],
];

const exact = new Map(pairs);
const originalText = new WeakMap<Node, string>();
for (const item of catalog as Array<{ nameRu: string; nameEn: string; descriptionRu?: string; descriptionEn?: string; noteRu?: string | null; noteEn?: string | null; disclaimerRu?: string | null; disclaimerEn?: string | null; scheduleRu?: string; scheduleEn?: string; whoRu?: string; whoEn?: string }>) {
  for (const [ru, en] of [[item.nameRu, item.nameEn], [item.descriptionRu, item.descriptionEn], [item.noteRu, item.noteEn], [item.disclaimerRu, item.disclaimerEn], [item.scheduleRu, item.scheduleEn], [item.whoRu, item.whoEn]] as Array<[string | undefined | null, string | undefined | null]>) if (ru && en) exact.set(ru, en);
}
for (const item of medicines as Array<{ ru: string; en: string }>) if (item.ru && item.en) exact.set(item.ru, item.en);
for (const item of facts as Array<{ ru: string; en: string }>) if (item.ru && item.en) exact.set(item.ru, item.en);
for (const item of rules as Array<{ title_ru: string; title_en?: string; reason_ru: string; reason_en?: string; tests_ru: string[]; tests_en?: string[]; schedule_ru: string; schedule_en?: string }>) {
  if (item.title_ru && item.title_en) exact.set(item.title_ru, item.title_en);
  if (item.reason_ru && item.reason_en) exact.set(item.reason_ru, item.reason_en);
  if (item.schedule_ru && item.schedule_en) exact.set(item.schedule_ru, item.schedule_en);
  item.tests_ru.forEach((test, index) => { if (test && item.tests_en?.[index]) exact.set(test, item.tests_en[index]); });
}

function translate(source: string, lang: Language): string {
  if (lang === "ru") return source;
  const direct = exact.get(source);
  if (direct) return direct;
  let match = /^Дата рождения: (.+)$/.exec(source); if (match) return `Date of birth: ${match[1]}`;
  match = /^Активных лекарств: (\d+)$/.exec(source); if (match) return `Active medications: ${match[1]}`;
  match = /^(\d+) записей$/.exec(source); if (match) return `${match[1]} records`;
  match = /^Осталось проверить: (.+)\.$/.exec(source); if (match) return `Still to check: ${match[1]}.`;
  match = /^До (\d{4}-\d{2}-\d{2})$/.exec(source); if (match) return `Due ${match[1]}`;
  match = /^Запланировано: (\d{4}-\d{2}-\d{2}) · доза (\d+)\/(\d+)$/.exec(source); if (match) return `Scheduled: ${match[1]} · dose ${match[2]}/${match[3]}`;
  match = /^Просрочено: (\d{4}-\d{2}-\d{2}) · доза (\d+)\/(\d+)$/.exec(source); if (match) return `Overdue: ${match[1]} · dose ${match[2]}/${match[3]}`;
  match = /^(\d+) рекомендаций требуют внимания$/.exec(source); if (match) return `${match[1]} recommendations need attention`;
  return source;
}

function applyLanguage(lang: Language) {
  document.documentElement.lang = lang;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) continue;
    const original = node.textContent || "";
    const remembered = originalText.get(node);
    const source = remembered && original !== remembered && original !== translate(remembered, "en") && original !== translate(remembered, "ru") ? original : (remembered || original);
    originalText.set(node, source);
    const next = translate(source, lang);
    if (next !== original) node.textContent = next;
  }
  for (const element of Array.from(document.querySelectorAll<HTMLElement>("input,textarea,button"))) {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const source = element.dataset[`karta${attribute.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`] || element.getAttribute(attribute);
      if (!source) continue;
      const key = `karta${attribute.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
      element.dataset[key] = source;
      element.setAttribute(attribute, translate(source, lang));
    }
  }
}

export function LanguageRuntime() {
  const [lang, setLang] = useState<Language>(() => typeof document !== "undefined" && document.cookie.match(/(?:^|; )karta_lang=(en|ru)/)?.[1] === "en" ? "en" : "ru");
  useEffect(() => {
    const stored = document.cookie.match(/(?:^|; )karta_lang=(en|ru)/)?.[1] as Language | undefined;
    const initial = stored || "ru";
    let current: Language = initial;
    applyLanguage(initial);
    const eventHandler = (event: Event) => { current = (event as CustomEvent<Language>).detail; };
    window.addEventListener("karta-language-change", eventHandler);
    const observer = new MutationObserver(() => applyLanguage(current));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); window.removeEventListener("karta-language-change", eventHandler); };
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    applyLanguage(lang);
    document.cookie = `karta_lang=${lang}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new CustomEvent("karta-language-change", { detail: lang }));
  }, [lang]);
  return <button type="button" onClick={() => setLang((value) => value === "ru" ? "en" : "ru")} aria-label={lang === "ru" ? "Switch to English" : "Переключить на русский"} style={{ position: "fixed", top: 10, right: "max(12px, calc(50% - 202px))", zIndex: 70, border: "1px solid rgba(92,124,250,.2)", borderRadius: 999, padding: "6px 10px", background: "rgba(255,255,255,.82)", color: "#5C7CFA", fontSize: 11, fontWeight: 700, boxShadow: "0 4px 14px rgba(26,32,80,.08)" }}>{lang === "ru" ? "EN" : "RU"}</button>;
}
