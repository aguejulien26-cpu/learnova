// ============================================================
// LEARNOVA — CONFIG GLOBALE V4
// ============================================================
import { createClient } from ' https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm '

export const SB_URL = " https://jbshkbqchrehfhoodtuj.supabase.co "
export const SB_KEY = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs"
export const BACKEND_URL = " https://learnova-backend-28pl.onrender.com "

export const sb = createClient(SB_URL, SB_KEY, {
auth: { autoRefreshToken: true, persistSession: true }
})

// Notification Toast
export function toast(msg, type = 'dark', dur = 3500) {
soit t = document.getElementById('ln-toast')
si (!t) {
t = document.createElement('div')
t.id = 'ln-toast'
t.style.cssText = "position:fixed;bottom:22px;right:22px;padding:12px 20px;border-radius:12px;font-size:.84rem;z-index:9999;transform:translateY(80px);transition:all .35s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 16px 48px rgba(0,0,0,.22);max-width:300px;line-height:1.4;"
document.body.appendChild(t)
}
const bg = { dark: '#09090f', ok: '#047857', err: '#b91c1c', info: '#1a56db' }
t.style.background = bg[type] || bg.dark
t.style.color = '#fff'
t.textContent = msg
t.style.transform = 'translateY(0)'
si (t._t) effacerTimeout(t._t)
  t._t = setTimeout(() => { t.style.transform = 'translateY(80px)' }, dur)
}

// Traduire les erreurs Supabase
export function translateErr(msg) {
  if (!msg) return 'Erreur inconnue.'
  const m = msg.toLowerCase()
  if (m.includes('already registered') || m.includes('user already registered'))
    return 'Cet email est déjà utilisé. Connecte-toi plutôt.'
  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('invalid email or password'))
    return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed'))
    return 'Confirme ton email avant de te connecter.'
  if (m.includes('password'))
    return 'Mot de passe trop court (minimum 6 caractères).'
  if (m.includes('too many') || m.includes('rate limit'))
    return 'Trop de tentatives. Attends quelques minutes.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Problème de connexion internet.'
  return 'Une erreur est survenue. Réessaie.'
}

// Appeler le backend IA
export async function callBackend(endpoint, body) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    return null
  }
}

// Temps relatif
export function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((new Date() - d) / 1000)
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('fr', { day: 'numeric', month: 'short' })
}
