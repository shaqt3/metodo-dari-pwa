import { createClient } from '@supabase/supabase-js'

// Claves extraídas de tu configuración actual
const supabaseUrl = 'https://cscdbalslyyfucutekxa.supabase.co'
const supabaseKey = 'sb_publishable_KcaK5JQ9FCVOA1JjQfRIUg_06wKpk_y'

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)
