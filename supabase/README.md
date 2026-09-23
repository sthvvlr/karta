# Karta cloud database

The canonical schema is in `migrations/20260923_karta_core.sql`. It is shared
by the iOS and mobile web clients and keeps private user data behind Supabase
Row Level Security.

## Setup on a new or recovered Supabase project

1. Create or restore the Supabase project in the account that owns Karta.
2. Run `migrations/20260923_karta_core.sql` once in the Supabase SQL Editor.
3. Put the new project URL and anon key in `karta/.env.local`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only, then run:

   ```bash
   npm run db:seed-vaccines
   ```

The seed imports the 12 bilingual vaccine entries, dose schedules, and 150
vaccine-brand names from `src/data/`.

The iOS `SupabaseManager.swift` still contains the retired project URL and
must be pointed at the new project before releasing an iOS build. Do not put a
service-role key in iOS or browser code.
