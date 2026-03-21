
import { createClient } from '@supabase/supabase-js';
const supabaseUrl ="https://jbshkbqchrehfhoodtuj.supabase.co" // Remplacez par l'URL de votre Supabase
const supabaseAnonKey = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs" // Remplacez par votre clé API publique
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

