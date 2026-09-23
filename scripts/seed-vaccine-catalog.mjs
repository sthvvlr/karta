import fs from 'node:fs/promises'
import path from 'node:path'

function env(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

const baseUrl = env('NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '')
const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')
const root = path.resolve(new URL('..', import.meta.url).pathname)
const vaccines = JSON.parse(await fs.readFile(path.join(root, 'src/data/vaccinations_catalog.json'), 'utf8'))
const brands = JSON.parse(await fs.readFile(path.join(root, 'src/data/vaccine_brands.json'), 'utf8'))

async function request(table, options = {}) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}${options.query ?? ''}`, {
    method: options.method ?? 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer ?? 'resolution=merge-duplicates,return=minimal',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`${table} seed failed (${response.status}): ${message.slice(0, 300)}`)
  }
}

const vaccineRows = vaccines.map((vaccine) => ({
  catalog_id: vaccine.id,
  name_ru: vaccine.nameRu,
  name_en: vaccine.nameEn,
  description_ru: vaccine.descriptionRu ?? null,
  description_en: vaccine.descriptionEn ?? null,
  who_ru: vaccine.whoRu ?? null,
  who_en: vaccine.whoEn ?? null,
  schedule_ru: vaccine.scheduleRu ?? null,
  schedule_en: vaccine.scheduleEn ?? null,
  frequency_type: vaccine.frequencyType ?? null,
  interval_years: vaccine.intervalYears ?? null,
  audience: vaccine.audience ?? null,
  tags: vaccine.tags ?? [],
  note_ru: vaccine.noteRu ?? null,
  note_en: vaccine.noteEn ?? null,
  disclaimer_ru: vaccine.disclaimerRu ?? null,
  disclaimer_en: vaccine.disclaimerEn ?? null,
  pregnancy_relevant: vaccine.pregnancyRelevant ?? false,
  pregnancy_note_ru: vaccine.pregnancyNoteRu ?? null,
  pregnancy_note_en: vaccine.pregnancyNoteEn ?? null,
  infant_contact_note_ru: vaccine.infantContactNoteRu ?? null,
  infant_contact_note_en: vaccine.infantContactNoteEn ?? null,
  track_date: vaccine.trackDate ?? true,
  total_doses: vaccine.totalDoses ?? 1,
  dose_schedule_days: vaccine.doseScheduleDays ?? [],
  requires_endemic_check: vaccine.requiresEndemicCheck ?? null,
  age_min: vaccine.ageMin ?? null,
  regions: vaccine.regions ?? {},
}))

await request('vaccines?on_conflict=catalog_id', { body: vaccineRows })

const doseRows = vaccines.flatMap((vaccine) =>
  (vaccine.doseScheduleDays ?? []).map((days, index) => ({
    vaccine_catalog_id: vaccine.id,
    dose_number: index + 2,
    interval_from_prev_days: days,
  })),
)
if (doseRows.length) {
  await request('vaccine_doses?on_conflict=vaccine_catalog_id,dose_number', { body: doseRows })
}

const brandRows = Object.entries(brands).flatMap(([vaccineId, names]) =>
  names.map((name) => ({ vaccine_catalog_id: vaccineId, name })),
)
if (brandRows.length) {
  await request('vaccine_brands?on_conflict=vaccine_catalog_id,name', { body: brandRows })
}

console.log(`Seeded ${vaccineRows.length} vaccines, ${doseRows.length} dose schedules, ${brandRows.length} brands.`)
