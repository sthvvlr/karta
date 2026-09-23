-- Karta: canonical cloud schema shared by the iOS app and the mobile web app.
-- Apply this migration to a new/recovered Supabase project before running the
-- vaccine catalog seed script.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  gender           text check (gender in ('male', 'female', 'other')),
  birth_date       date,
  city_current     text,
  country_current  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.profile_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  city        text not null,
  country     text not null,
  from_year   integer not null,
  to_year     integer,
  is_current  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- The catalog is shared reference data. catalog_id is the stable identifier
-- already used by the iOS JSON catalog and local user records.
create table if not exists public.vaccines (
  catalog_id             text primary key,
  id                     uuid not null unique default gen_random_uuid(),
  name_ru                text not null,
  name_en                text not null,
  description_ru         text,
  description_en         text,
  who_ru                 text,
  who_en                 text,
  schedule_ru            text,
  schedule_en            text,
  frequency_type         text,
  interval_years         integer,
  audience               text,
  tags                   text[] not null default '{}',
  note_ru                text,
  note_en                text,
  disclaimer_ru          text,
  disclaimer_en          text,
  pregnancy_relevant     boolean not null default false,
  pregnancy_note_ru      text,
  pregnancy_note_en      text,
  infant_contact_note_ru text,
  infant_contact_note_en text,
  track_date             boolean not null default true,
  total_doses            integer not null default 1,
  dose_schedule_days     integer[] not null default '{}',
  requires_endemic_check boolean,
  age_min                integer,
  regions                jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.vaccine_doses (
  id                       uuid primary key default gen_random_uuid(),
  vaccine_catalog_id       text not null references public.vaccines(catalog_id) on delete cascade,
  dose_number              integer not null,
  interval_from_prev_days  integer,
  is_booster               boolean not null default false,
  notes                    text,
  unique (vaccine_catalog_id, dose_number)
);

create table if not exists public.vaccine_brands (
  id                   uuid primary key default gen_random_uuid(),
  vaccine_catalog_id   text not null references public.vaccines(catalog_id) on delete cascade,
  name                 text not null,
  unique (vaccine_catalog_id, name)
);

-- User vaccination records. Column names intentionally preserve the iOS REST
-- contract so both clients can use the same rows.
create table if not exists public.vaccinations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  catalog_id     text references public.vaccines(catalog_id),
  name           text not null,
  date_string    text not null default '',
  date_done      date,
  doses          integer not null default 1,
  total_doses    integer not null default 1,
  next_due       text,
  is_upcoming    boolean not null default false,
  vaccine_brand  text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.medications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  drug_code      text not null default '',
  name           text not null,
  dosage         text not null default '',
  frequency      text not null default 'daily',
  days_of_week   integer[] not null default '{}',
  time_slots     jsonb not null default '[]'::jsonb,
  meal_relation  text not null default 'any',
  is_indefinite  boolean not null default true,
  end_date       date,
  is_active      boolean not null default true,
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.medication_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  medication_id  uuid not null references public.medications(id) on delete cascade,
  scheduled_at   timestamptz not null,
  taken_at       timestamptz,
  status         text not null default 'pending'
                 check (status in ('pending', 'taken', 'missed', 'skipped')),
  notes          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.lab_results (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  date        date not null default current_date,
  indicators  jsonb not null default '[]'::jsonb,
  file_path   text,
  file_ext    text,
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists profile_locations_user_idx on public.profile_locations(user_id);
create index if not exists vaccinations_user_idx on public.vaccinations(user_id, created_at);
create index if not exists medications_user_idx on public.medications(user_id, created_at);
create index if not exists medication_logs_user_time_idx on public.medication_logs(user_id, scheduled_at);
create index if not exists lab_results_user_date_idx on public.lab_results(user_id, date desc);

alter table public.profiles enable row level security;
alter table public.profile_locations enable row level security;
alter table public.vaccines enable row level security;
alter table public.vaccine_doses enable row level security;
alter table public.vaccine_brands enable row level security;
alter table public.vaccinations enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.lab_results enable row level security;

drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profile_locations_owner" on public.profile_locations;
create policy "profile_locations_owner" on public.profile_locations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vaccines_public_read" on public.vaccines;
create policy "vaccines_public_read" on public.vaccines for select using (true);

drop policy if exists "vaccine_doses_public_read" on public.vaccine_doses;
create policy "vaccine_doses_public_read" on public.vaccine_doses for select using (true);

drop policy if exists "vaccine_brands_public_read" on public.vaccine_brands;
create policy "vaccine_brands_public_read" on public.vaccine_brands for select using (true);

drop policy if exists "vaccinations_owner" on public.vaccinations;
create policy "vaccinations_owner" on public.vaccinations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "medications_owner" on public.medications;
create policy "medications_owner" on public.medications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "medication_logs_owner" on public.medication_logs;
create policy "medication_logs_owner" on public.medication_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lab_results_owner" on public.lab_results;
create policy "lab_results_owner" on public.lab_results for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('lab-files', 'lab-files', false)
on conflict (id) do nothing;

drop policy if exists "lab_files_owner_read" on storage.objects;
create policy "lab_files_owner_read" on storage.objects for select
  using (bucket_id = 'lab-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "lab_files_owner_insert" on storage.objects;
create policy "lab_files_owner_insert" on storage.objects for insert
  with check (bucket_id = 'lab-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "lab_files_owner_update" on storage.objects;
create policy "lab_files_owner_update" on storage.objects for update
  using (bucket_id = 'lab-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'lab-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "lab_files_owner_delete" on storage.objects;
create policy "lab_files_owner_delete" on storage.objects for delete
  using (bucket_id = 'lab-files' and (storage.foldername(name))[1] = auth.uid()::text);
