-- ============================================================
-- KARTA — Database Schema
-- Run this in Supabase SQL Editor (once, in order)
-- ============================================================


-- ── 1. PROFILES ─────────────────────────────────────────────

create table profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text,
  gender        text check (gender in ('male', 'female', 'other')),
  birth_date    date,
  city_current  text,
  country_current text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── 2. LOCATION HISTORY ─────────────────────────────────────
-- City/country where user lived (used for region-specific vaccine recommendations)

create table profile_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  city        text not null,
  country     text not null,
  from_year   int  not null,
  to_year     int,           -- null = still living there
  is_current  boolean default false,
  created_at  timestamptz default now()
);


-- ── 3. VACCINES CATALOG ─────────────────────────────────────
-- Master list of all vaccines (filled by us, not users)

create table vaccines (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  name_ru                   text,
  disease_prevented         text,          -- "Гепатит B", "Корь, краснуха, паротит"
  description               text,
  description_ru            text,

  -- Who it's for
  gender_specific           text check (gender_specific in ('all', 'male', 'female')) default 'all',

  -- Catch-up: can you get it as adult if missed in childhood?
  catch_up_possible         boolean default true,
  catch_up_notes            text,          -- e.g. "Если нет данных о прививке — сделать"

  -- Repeat / booster
  needs_repeat              boolean default false,
  repeat_interval_months    int,           -- null if no repeat needed

  -- Context flags
  is_mandatory              boolean default false,  -- in national calendar
  risk_groups               text[],        -- e.g. {"travelers", "healthcare", "elderly"}
  country_codes             text[],        -- countries where recommended, e.g. {"RU","US"}

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- ── 4. VACCINE DOSE SCHEDULE ────────────────────────────────
-- Each vaccine can have multiple doses at different ages

create table vaccine_doses (
  id                        uuid primary key default gen_random_uuid(),
  vaccine_id                uuid references vaccines(id) on delete cascade not null,
  dose_number               int  not null,    -- 1, 2, 3…
  recommended_age_months_min int,             -- earliest to give this dose
  recommended_age_months_max int,             -- latest (for national calendar)
  interval_from_prev_months  int,             -- min gap from previous dose
  is_booster                boolean default false,
  notes                     text
);


-- ── 5. USER VACCINATIONS ────────────────────────────────────
-- What a user has actually done (or knows about themselves)

create table user_vaccinations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  vaccine_id      uuid references vaccines(id) not null,
  dose_number     int,          -- which dose (1, 2, 3…); null if user doesn't know

  -- When: fill what you know
  date_given      date,         -- exact date if known
  year_given      int,          -- year only if date unknown

  -- What the user knows about this vaccination
  memory_status   text check (memory_status in ('certain', 'uncertain', 'never')) not null,
  -- certain   = has a record or remembers clearly
  -- uncertain = thinks they had it but not sure
  -- never     = knows they never had it

  document_url    text,         -- optional: scan of vaccination card
  notes           text,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- ── 6. USER MEDICATIONS ─────────────────────────────────────
-- A user's personal medication list

create table user_medications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,

  name            text not null,
  dosage          text,                   -- "500 мг", "1 таблетка"

  -- Schedule
  frequency_days  int not null default 1, -- every N days (1=daily, 7=weekly)
  times_per_day   int not null default 1,
  reminder_times  time[],                 -- e.g. {08:00, 20:00}
  meal_relation   text check (meal_relation in ('before', 'after', 'during', 'any')) default 'any',

  -- Duration
  start_date      date not null default current_date,
  end_date        date,                   -- null = ongoing
  active          boolean default true,

  notes           text,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- ── 7. MEDICATION LOGS ──────────────────────────────────────
-- Daily tracking: did the user take each scheduled dose?

create table medication_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  medication_id   uuid references user_medications(id) on delete cascade not null,

  scheduled_at    timestamptz not null,   -- when they were supposed to take it
  taken_at        timestamptz,            -- when they actually took it (null = not yet)

  status          text check (status in ('pending', 'taken', 'missed', 'skipped')) default 'pending',
  notes           text,

  created_at  timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY — users see only their own data
-- ============================================================

alter table profiles          enable row level security;
alter table profile_locations enable row level security;
alter table user_vaccinations enable row level security;
alter table user_medications  enable row level security;
alter table medication_logs   enable row level security;

-- Vaccines catalog is public (read-only for everyone)
alter table vaccines      enable row level security;
alter table vaccine_doses enable row level security;

create policy "public read vaccines"      on vaccines      for select using (true);
create policy "public read vaccine_doses" on vaccine_doses for select using (true);

-- Profiles
create policy "own profile"
  on profiles for all
  using (auth.uid() = id);

-- Locations
create policy "own locations"
  on profile_locations for all
  using (auth.uid() = user_id);

-- Vaccinations
create policy "own vaccinations"
  on user_vaccinations for all
  using (auth.uid() = user_id);

-- Medications
create policy "own medications"
  on user_medications for all
  using (auth.uid() = user_id);

-- Logs
create policy "own logs"
  on medication_logs for all
  using (auth.uid() = user_id);


-- ============================================================
-- INDEXES
-- ============================================================

create index on profile_locations (user_id);
create index on user_vaccinations (user_id, vaccine_id);
create index on user_medications  (user_id) where active = true;
create index on medication_logs   (user_id, scheduled_at);
create index on medication_logs   (medication_id, scheduled_at);
