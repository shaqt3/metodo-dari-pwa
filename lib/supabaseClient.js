import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://npwpbdzgsewpfsoqxnna.supabase.co";
const supabaseAnonKey = "sb_publishable_tXxY_wu9wZk-tZ8HeYtR2Q_VYFz4aZt";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
