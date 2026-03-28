// ================================================================
// LEARNOVA — Configuration globale partagée
// Ce fichier est importé dans toutes les pages HTML
// ================================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const SUPABASE_URL = "https://jbshkbqchrehfhoodtuj.supabase.co"
export const SUPABASE_KEY = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs"
export const BACKEND_URL  = "https://learnova-backend-28pl.onrender.com"

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true }
})

// Traduction erreurs Supabase
export function translateErr(msg) {
  if (!msg) return "Erreur inconnue."
  const m = msg.toLowerCase()
  if (m.includes('already registered')) return "Email déjà utilisé. Connecte-toi."
  if (m.includes('invalid login') || m.includes('invalid credentials')) return "Email ou mot de passe incorrect."
  if (m.includes('email not confirmed')) return "Vérifie ton email."
  if (m.includes('password')) return "Mot de passe trop court (min. 6)."
  if (m.includes('too many')) return "Trop de tentatives. Attends quelques minutes."
  return "Erreur. Réessaie."
}

// Toast notification
export function toast(msg, type = 'dark') {
  let t = document.getElementById('ln-toast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'ln-toast'
    t.style.cssText = `position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:12px;
      font-size:.84rem;z-index:9999;transform:translateY(80px);transition:all .35s cubic-bezier(.34,1.56,.64,1);
      font-family:'DM Sans',sans-serif;max-width:320px;font-weight:500;box-shadow:0 20px 60px rgba(0,0,0,.2);`
    document.body.appendChild(t)
  }
  const styles = {
    dark: 'background:#09090f;color:#fff;',
    ok:   'background:#047857;color:#fff;',
    err:  'background:#b91c1c;color:#fff;'
  }
  t.style.cssText += styles[type] || styles.dark
  t.textContent = msg
  t.style.transform = 'translateY(0)'
  clearTimeout(t._timeout)
  t._timeout = setTimeout(() => t.style.transform = 'translateY(80px)', 3500)
}

// Incrémenter stat
export async function incrementStat(name) {
  await sb.rpc('increment_stat', { stat_name: name }).catch(() => {})
}
