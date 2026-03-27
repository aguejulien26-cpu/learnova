// ============================================================
// LEARNOVA — auth.js
// Gestion centralisée de l'authentification Supabase
// À inclure dans TOUTES les pages HTML
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ── CONFIG ───────────────────────────────────────────────────
export const SUPABASE_URL = "https://jbshkbqchrehfhoodtuj.supabase.co"
export const SUPABASE_KEY = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs"
export const BACKEND_URL  = "https://learnova-backend-28pl.onrender.com"

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ── INSCRIPTION ──────────────────────────────────────────────
export async function signUp(prenom, email, password) {
  if (!prenom || prenom.length < 2) return { error: "Entre ton prénom (min. 2 caractères)." }
  if (!email || !email.includes("@")) return { error: "Adresse email invalide." }
  if (!password || password.length < 6) return { error: "Mot de passe trop court (min. 6 caractères)." }

  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { prenom } }
  })

  if (error) return { error: translateError(error.message) }

  // Créer le profil dans la table profiles
  const user = data.user
  if (user) {
    const { error: profileError } = await sb.from('profiles').upsert({
      id: user.id,
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      score_total: 0,
      created_at: new Date().toISOString()
    })

    if (!profileError) {
      // Incrémenter le compteur d'inscrits
      await sb.rpc('increment_stat', { stat_name: 'total_inscrits' }).catch(() => {})
    }
  }

  return { success: true, user: data.user, message: `🎉 Bienvenue ${prenom} ! Vérifie ton email pour confirmer ton compte.` }
}

// ── CONNEXION ────────────────────────────────────────────────
export async function signIn(email, password) {
  if (!email || !email.includes("@")) return { error: "Adresse email invalide." }
  if (!password) return { error: "Entre ton mot de passe." }

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  })

  if (error) return { error: translateError(error.message) }
  return { success: true, user: data.user }
}

// ── DÉCONNEXION ───────────────────────────────────────────────
export async function signOut() {
  await sb.auth.signOut()
  window.location.href = 'index.html'
}

// ── RÉCUPÉRER LE PROFIL ───────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single()
  return error ? null : data
}

// ── TRADUCTION DES ERREURS ────────────────────────────────────
export function translateError(msg) {
  if (!msg) return "Une erreur est survenue."
  const m = msg.toLowerCase()
  if (m.includes('already registered') || m.includes('user already registered'))
    return "Cet email est déjà utilisé. Connecte-toi plutôt."
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return "Email ou mot de passe incorrect."
  if (m.includes('email not confirmed'))
    return "Vérifie ton email pour confirmer ton compte."
  if (m.includes('password'))
    return "Mot de passe trop court (minimum 6 caractères)."
  if (m.includes('network') || m.includes('fetch'))
    return "Problème de connexion. Vérifie ta connexion internet."
  if (m.includes('too many requests'))
    return "Trop de tentatives. Attends quelques minutes."
  return "Une erreur est survenue. Réessaie."
}
