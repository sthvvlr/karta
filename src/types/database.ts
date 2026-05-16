export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          gender: 'male' | 'female' | 'other' | null
          birth_date: string | null
          city_current: string | null
          country_current: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>> & { id: string }
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>>
      }
      profile_locations: {
        Row: {
          id: string
          user_id: string
          city: string
          country: string
          from_year: number
          to_year: number | null
          is_current: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profile_locations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['profile_locations']['Insert']>
      }
      vaccines: {
        Row: {
          id: string
          name: string
          name_ru: string | null
          disease_prevented: string | null
          description: string | null
          description_ru: string | null
          gender_specific: 'all' | 'male' | 'female'
          catch_up_possible: boolean
          catch_up_notes: string | null
          needs_repeat: boolean
          repeat_interval_months: number | null
          is_mandatory: boolean
          risk_groups: string[] | null
          country_codes: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vaccines']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vaccines']['Insert']>
      }
      vaccine_doses: {
        Row: {
          id: string
          vaccine_id: string
          dose_number: number
          recommended_age_months_min: number | null
          recommended_age_months_max: number | null
          interval_from_prev_months: number | null
          is_booster: boolean
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['vaccine_doses']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['vaccine_doses']['Insert']>
      }
      user_vaccinations: {
        Row: {
          id: string
          user_id: string
          vaccine_id: string
          dose_number: number | null
          date_given: string | null
          year_given: number | null
          memory_status: 'certain' | 'uncertain' | 'never'
          document_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_vaccinations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_vaccinations']['Insert']>
      }
      user_medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string | null
          frequency_days: number
          times_per_day: number
          reminder_times: string[] | null
          meal_relation: 'before' | 'after' | 'during' | 'any'
          start_date: string
          end_date: string | null
          active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_medications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_medications']['Insert']>
      }
      medication_logs: {
        Row: {
          id: string
          user_id: string
          medication_id: string
          scheduled_at: string
          taken_at: string | null
          status: 'pending' | 'taken' | 'missed' | 'skipped'
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medication_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medication_logs']['Insert']>
      }
    }
  }
}

export type Profile       = Database['public']['Tables']['profiles']['Row']
export type Vaccination   = Database['public']['Tables']['user_vaccinations']['Row']
export type Medication    = Database['public']['Tables']['user_medications']['Row']
export type MedLog        = Database['public']['Tables']['medication_logs']['Row']
export type Vaccine       = Database['public']['Tables']['vaccines']['Row']
