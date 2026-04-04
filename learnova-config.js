// ============================================================
// LEARNOVA — CONFIG GLOBALE V4 — FLY.IO
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const SB_URL      = "https://jbshkbqchrehfhoodtuj.supabase.co"
export const SB_KEY      = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs"

// 🚀 Backend hébergé sur Fly.io (remplace Render)
export const BACKEND_URL = "https://learnova-backend.fly.dev"

// 💳 FedaPay — remplace par ta vraie clé publique
export const FEDAPAY_PUBLIC_KEY = "pk_live_VOTRE_CLE_FEDAPAY_ICI"

export const sb = createClient(SB_URL, SB_KEY, {
  auth: { autoRefreshToken: true, persistSession: true }
})

// Toast notification
export function toast(msg, type = 'dark', dur = 3500) {
  let t = document.getElementById('ln-toast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'ln-toast'
    t.style.cssText = "position:fixed;bottom:22px;right:22px;padding:12px 20px;border-radius:12px;font-size:.84rem;z-index:9999;transform:translateY(80px);transition:all .35s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 16px 48px rgba(0,0,0,.22);max-width:300px;line-height:1.4;"
    document.body.appendChild(t)
  }
  const bg = { dark:'#09090f', ok:'#057a55', err:'#c81c1c', info:'#1a56db' }
  t.style.background = bg[type] || bg.dark
  t.style.color = '#fff'
  t.textContent = msg
  t.style.transform = 'translateY(0)'
  clearTimeout(t._t)
  t._t = setTimeout(() => { t.style.transform = 'translateY(80px)' }, dur)
}

// Traduire les erreurs Supabase
export function translateErr(msg) {
  if (!msg) return 'Erreur inconnue.'
  const m = msg.toLowerCase()
  if (m.includes('already registered') || m.includes('user already registered'))
    return 'Cet email est déjà utilisé. Connecte-toi.'
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed'))
    return 'Confirme ton email avant de te connecter.'
  if (m.includes('password'))
    return 'Mot de passe trop court (minimum 6 caractères).'
  if (m.includes('too many') || m.includes('rate limit'))
    return 'Trop de tentatives. Attends quelques minutes.'
  return 'Une erreur est survenue. Réessaie.'
}

// Appel backend Fly.io
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
    console.error(`[Backend] ${endpoint}:`, e)
    return null
  }
}

// Dark mode toggle universel
export function setupTheme() {
  const saved = localStorage.getItem('ln_theme') || 'light'
  document.documentElement.setAttribute('data-theme', saved)
  const btn = document.getElementById('themeBtn')
  if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙'
}

export function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme')
  const next = cur === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('ln_theme', next)
  const btn = document.getElementById('themeBtn')
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙'
}

// Temps relatif
export function timeAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)}h`
  return new Date(dateStr).toLocaleDateString('fr', { day: 'numeric', month: 'short' })
}