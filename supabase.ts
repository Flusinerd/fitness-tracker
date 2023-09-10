import { createClient } from "@supabase/supabase-js"
import 'react-native-url-polyfill/auto'
import { Database } from "./types/supabase"

const supabaseUrl = "https://rlnhpldkhuhwydlklput.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmhwbGRraHVod3lkbGtscHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY4NTgyOTgsImV4cCI6MjAwMjQzNDI5OH0.Xb6YAXM8Lhdn6rnuWwuvNw-RBl9d6Px3IAXdQKc-dbI"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})