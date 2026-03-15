// ============================================================
// LEARNOVA — Configuration Supabase (js/supabase-config.js)
//
// ⚠️ SEULE CHOSE À FAIRE :
// Remplace SUPABASE_ANON_KEY par ta vraie clé anon
//
// OÙ TROUVER LA CLÉ :
// Supabase → Settings ⚙️ → API → "anon public" → Copier
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ✅ URL déjà remplie — c'est la tienne !
const SUPABASE_URL = "https://jbshkbqchrehfhoodtuj.supabase.co"

// ⚠️ REMPLACE CECI par ta vraie clé anon (dans Settings → API)
const SUPABASE_ANON_KEY = sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs

// ─────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// URL de ton backend Render (à remplir après déploiement)
export const BACKEND_URL = "https://learnova-backend.onrender.com"


// ============================================================
// AUTH — Inscription / Connexion
// ============================================================

export async function signUp(prenom, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { prenom } }
  })
  if (error) return { success: false, error: error.message }

  if (data.user) {
    await supabase.from('profiles').insert({
      id:          data.user.id,
      prenom:      prenom,
      email:       email,
      role:        'student',
      score_total: 0
    })
  }
  return { success: true, user: data.user }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  return { success: true, user: data.user }
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/index.html' }
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

export async function getProfile(uid) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  return data
}


// ============================================================
// STATS — Compteurs en temps réel
// ============================================================

export async function getStats() {
  const { data } = await supabase
    .from('stats')
    .select('*')
    .eq('id', 1)
    .single()
  return data
}

export function watchStats(callback) {
  getStats().then(callback)
  return supabase
    .channel('stats-changes')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'stats' },
      (payload) => callback(payload.new)
    )
    .subscribe()
}


// ============================================================
// PRÉSENCE — Qui est en ligne
// ============================================================

export function markOnline(uid, prenom, page = 'home') {
  const channel = supabase.channel('online-users', {
    config: { presence: { key: uid } }
  })
  channel
    .on('presence', { event: 'sync' }, () => {
      const count = Object.keys(channel.presenceState()).length
      const el = document.getElementById('statOnline')
      if (el) el.textContent = count
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ uid, prenom, page })
      }
    })
}

export function watchOnlineCount(callback) {
  const channel = supabase.channel('online-count')
  channel
    .on('presence', { event: 'sync' }, () => {
      callback(Object.keys(channel.presenceState()).length)
    })
    .subscribe()
  return channel
}


// ============================================================
// SESSIONS
// ============================================================

export async function createSession(sessionData) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Non connecté' }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      ...sessionData,
      nb_inscrits: 0,
      statut: 'planifie',
      cree_par: user.id
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  await supabase.rpc('increment_stat', { stat_name: 'total_sessions' })
  return { success: true, session: data }
}

export function watchSessions(callback) {
  supabase.from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .then(({ data }) => callback(data || []))

  return supabase
    .channel('sessions-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'sessions' },
      () => {
        supabase.from('sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => callback(data || []))
      }
    )
    .subscribe()
}

export async function joinSession(sessionId) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Non connecté' }

  const { error } = await supabase
    .from('session_participants')
    .insert({ session_id: sessionId, user_id: user.id })

  if (error && !error.message.includes('duplicate')) {
    return { success: false, error: error.message }
  }
  await supabase.rpc('increment_session_participants', { p_session_id: sessionId })
  return { success: true }
}

export async function getSessionParticipants(sessionId) {
  const { data } = await supabase
    .from('session_participants')
    .select('*, profiles(prenom, photo_url, score_total)')
    .eq('session_id', sessionId)
  return data || []
}


// ============================================================
// CHAT
// ============================================================

export async function sendMessage(sessionId, texte) {
  const user = await getCurrentUser()
  if (!user || !texte.trim()) return
  const profile = await getProfile(user.id)
  await supabase.from('messages').insert({
    session_id: sessionId,
    auteur_id:  user.id,
    auteur_nom: profile?.prenom || 'Apprenant',
    texte:      texte.trim()
  })
}

export function watchMessages(sessionId, callback) {
  supabase.from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .then(({ data }) => callback(data || [], 'initial'))

  return supabase
    .channel(`messages-${sessionId}`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => callback([payload.new], 'new')
    )
    .subscribe()
}


// ============================================================
// NOTES
// ============================================================

export async function saveNote(courseId, content) {
  const user = await getCurrentUser()
  if (!user) return
  await supabase.from('notes').upsert({
    user_id:    user.id,
    course_id:  courseId,
    content:    content,
    updated_at: new Date().toISOString()
  })
}

export async function getNote(courseId) {
  const user = await getCurrentUser()
  if (!user) return ''
  const { data } = await supabase
    .from('notes')
    .select('content')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()
  return data?.content || ''
}


// ============================================================
// TRADUCTION DES ERREURS EN FRANÇAIS
// ============================================================

export function translateError(msg) {
  if (!msg) return 'Une erreur est survenue.'
  if (msg.includes('already registered'))  return 'Cet email est déjà utilisé. Connecte-toi.'
  if (msg.includes('Invalid login'))       return 'Email ou mot de passe incorrect.'
  if (msg.includes('Password should be'))  return 'Mot de passe trop court (minimum 6 caractères).'
  if (msg.includes('Unable to validate'))  return 'Adresse email invalide.'
  if (msg.includes('Email not confirmed')) return 'Vérifie ton email et clique sur le lien de confirmation.'
  if (msg.includes('rate limit'))          return 'Trop de tentatives. Attends quelques minutes.'
  return 'Une erreur est survenue. Réessaie.'
}
