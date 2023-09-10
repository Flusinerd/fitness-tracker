export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          last_seen: string | null
          last_seen_at_lat: number | null
          last_seen_at_lon: number | null
          last_sent: string | null
          push_key: string
        }
        Insert: {
          last_seen?: string | null
          last_seen_at_lat?: number | null
          last_seen_at_lon?: number | null
          last_sent?: string | null
          push_key: string
        }
        Update: {
          last_seen?: string | null
          last_seen_at_lat?: number | null
          last_seen_at_lon?: number | null
          last_sent?: string | null
          push_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
