import { createClient } from '@supabase/supabase-js'

// Claves públicas (pensadas para ir en el navegador; la seguridad la dan las reglas RLS de la base)
const SUPABASE_URL = 'https://ffrubvhnondyiobnbtor.supabase.co'
const SUPABASE_KEY = 'sb_publishable_yCcI_qRbFqoTRjQm9jAS0w_5Rz4OS8j'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
