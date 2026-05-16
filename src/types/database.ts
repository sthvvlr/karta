export type Database = {
  public: {
    Tables: {
      vaccinations: {
        Row: {
          id: string
          user_id: string | null
          name: string
          date_given: string | null
          next_due: string | null
          status: 'done' | 'upcoming' | 'overdue'
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vaccinations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vaccinations']['Insert']>
      }
      medications: {
        Row: {
          id: string
          user_id: string | null
          name: string
          dosage: string | null
          frequency: string
          reminder_times: string[]
          start_date: string
          end_date: string | null
          active: boolean
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medications']['Insert']>
      }
    }
  }
}

export type Vaccination = Database['public']['Tables']['vaccinations']['Row']
export type Medication = Database['public']['Tables']['medications']['Row']
