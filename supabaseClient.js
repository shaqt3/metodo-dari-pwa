import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cscdbalslyyfucutekxa.supabase.co';
const supabaseKey = 'sb_publishable_KcaK5JQ9FCVOA1JjQfRIUg_06wKpk_y';

export const supabase = createClient(supabaseUrl, supabaseKey);