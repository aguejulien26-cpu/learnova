// ================================================================
// LEARNOVA — Configuration globale partagée
// Importez ce fichier dans chaque page HTML avec :
// import { sb, BACKEND_URL, toast } from './learnova-config.js'
// ================================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const SUPABASE_URL = "https://jbshkbqchrehfhoodtuj.supabase.co"
export const SUPABASE_KEY = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs"
export const BACKEND_URL  = "https://learnova-backend-28pl.onrender.com"

// Client Supabase unique
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true }
})

// ── TOAST NOTIFICATION ───────────────────────────────────────
export function toast(msg, type = 'dark', duration = 3500) {
  let t = document.getElementById('ln-toast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'ln-toast'
    t.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px',
      'padding:12px 20px', 'border-radius:12px',
      'font-size:.84rem', 'z-index:9999',
      'transform:translateY(80px)',
      'transition:all .35s cubic-bezier(.34,1.56,.64,1)',
      "font-family:'DM Sans',sans-serif", 'font-weight:500',
      'box-shadow:0 20px 60px rgba(0,0,0,.2)',
      'max-width:320px', 'line-height:1.4'
    ].join(';')
    document.body.appendChild(t)
  }
  const styles = {
    dark:   'background:#09090f;color:#fff;',
    ok:     'background:#047857;color:#fff;',
    err:    'background:#b91c1c;color:#fff;',
    info:   'background:#1a56db;color:#fff;',
    purple: 'background:#6d28d9;color:#fff;'
  }
  t.style.cssText += styles[type] || styles.dark
  t.textContent = msg
  t.style.transform = 'translateY(0)'
  clearTimeout(t._timeout)
  t._timeout = setTimeout(() => { t.style.transform = 'translateY(80px)' }, duration)
}

// ── TRADUCTION ERREURS SUPABASE ───────────────────────────────
export function translateErr(msg) {
  if (!msg) return 'Erreur inconnue.'
  const m = msg.toLowerCase()
  if (m.includes('already registered') || m.includes('user already registered'))
    return 'Cet email est déjà utilisé. Connecte-toi.'
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Email ou mot de passe incorrect.'
  if (m.includes('email not confirmed'))
    return 'Vérifie ton email pour confirmer ton compte.'
  if (m.includes('password'))
    return 'Mot de passe trop court (minimum 6 caractères).'
  if (m.includes('too many requests') || m.includes('too many'))
    return 'Trop de tentatives. Attends quelques minutes.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Problème de connexion internet.'
  return 'Une erreur est survenue. Réessaie.'
}

// ── INSCRIPTION ───────────────────────────────────────────────
export async function signUp(prenom, email, password) {
  if (!prenom || prenom.trim().length < 2)
    return { error: 'Entre ton prénom (min. 2 caractères).' }
  if (!email || !email.includes('@'))
    return { error: 'Adresse email invalide.' }
  if (!password || password.length < 6)
    return { error: 'Mot de passe trop court (min. 6 caractères).' }

  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { prenom: prenom.trim() } }
  })

  if (error) return { error: translateErr(error.message) }

  // Le trigger SQL crée le profil automatiquement
  // On le fait aussi ici par sécurité
  if (data.user) {
    await sb.from('profiles').upsert({
      id: data.user.id,
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      score_total: 0
    }).catch(() => {})
  }

  return {
    success: true,
    user: data.user,
    message: `🎉 Bienvenue ${prenom.trim()} ! Compte créé avec succès.`
  }
}

// ── CONNEXION ─────────────────────────────────────────────────
export async function signIn(email, password) {
  if (!email || !email.includes('@'))
    return { error: 'Adresse email invalide.' }
  if (!password)
    return { error: 'Entre ton mot de passe.' }

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  })

  if (error) return { error: translateErr(error.message) }
  return { success: true, user: data.user }
}

// ── RÉCUPÉRER PROFIL ──────────────────────────────────────────
export async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single()
  return data
}

// ── INCRÉMENTER STAT ──────────────────────────────────────────
export async function incrementStat(name) {
  await sb.rpc('increment_stat', { stat_name: name }).catch(() => {})
}

// ── APPELER LE BACKEND IA ─────────────────────────────────────
export async function callBackend(endpoint, body) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`Backend error (${endpoint}):`, e.message)
    return null
  }
}

// ── FORMAT TEMPS RELATIF ──────────────────────────────────────
export function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((new Date() - d) / 1000)
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('fr', { day: 'numeric', month: 'short' })
}
