/**
 * ================================================================
 * LEARNOVA CONFIG — Fichier de configuration centralisé
 * ================================================================
 * Toutes les pages importent ce fichier.
 * Tu ne changes qu'ici, et tout le site est mis à jour.
 *
 * UTILISATION dans chaque page HTML :
 *   <script type="module">
 *     import { SB, BACKEND, FEDAPAY_PK, fp, toast, toggleTheme } from './learnova-config.js'
 *   </script>
 * ================================================================
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ── SUPABASE ──────────────────────────────────────────────────
const SUPABASE_URL = "https://jbshkbqchrehfhoodtuj.supabase.co"
const SUPABASE_KEY = "sb_publishable_iBypuqRKhVqZUvNBmATW-w_I1LJHLRs"

export const SB = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: true, persistSession: true }
})

// ── BACKEND RENDER ────────────────────────────────────────────
// ⚠️  Remplace par l'URL exacte de ton service sur render.com
export const BACKEND = "https://learnova-backend.onrender.com"

// ── FEDAPAY ───────────────────────────────────────────────────
// ⚠️  Clé publique FedaPay (Dashboard FedaPay → Développeurs → Clés API)
// Sandbox (tests) : pk_sandbox_...
// Production      : pk_live_...
export const FEDAPAY_PK = "pk_sandbox_VOTRE_CLE_ICI"

// Mode sandbox automatique si la clé commence par pk_sandbox_
export const FEDAPAY_SANDBOX = FEDAPAY_PK.startsWith("pk_sandbox")

// ── OPÉRATEURS MOBILE MONEY PAR PAYS ─────────────────────────
export const OPERATORS = {
  BJ: [
    { code: "mtn-bj",    name: "MTN",    flag: "🇧🇯", prefix: "+229", hint: "01 XX XX XX",    color: "#ffcc00" },
    { code: "moov-bj",   name: "Moov",   flag: "🇧🇯", prefix: "+229", hint: "01 XX XX XX",    color: "#0047ab" }
  ],
  SN: [
    { code: "orange-sn", name: "Orange", flag: "🇸🇳", prefix: "+221", hint: "77 XXX XX XX",   color: "#ff6600" },
    { code: "wave-sn",   name: "Wave",   flag: "🇸🇳", prefix: "+221", hint: "77 XXX XX XX",   color: "#00a3e0" },
    { code: "free-sn",   name: "Free",   flag: "🇸🇳", prefix: "+221", hint: "76 XXX XX XX",   color: "#dc143c" }
  ],
  CI: [
    { code: "mtn-ci",    name: "MTN",    flag: "🇨🇮", prefix: "+225", hint: "07 XX XX XX XX", color: "#ffcc00" },
    { code: "orange-ci", name: "Orange", flag: "🇨🇮", prefix: "+225", hint: "07 XX XX XX XX", color: "#ff6600" },
    { code: "moov-ci",   name: "Moov",   flag: "🇨🇮", prefix: "+225", hint: "01 XX XX XX XX", color: "#0047ab" }
  ],
  TG: [
    { code: "tmoney",    name: "T-Money",flag: "🇹🇬", prefix: "+228", hint: "90 XX XX XX",    color: "#006400" },
    { code: "flooz-tg",  name: "Flooz",  flag: "🇹🇬", prefix: "+228", hint: "92 XX XX XX",    color: "#ff6600" }
  ],
  BF: [
    { code: "orange-bf", name: "Orange", flag: "🇧🇫", prefix: "+226", hint: "70 XX XX XX",    color: "#ff6600" },
    { code: "moov-bf",   name: "Moov",   flag: "🇧🇫", prefix: "+226", hint: "75 XX XX XX",    color: "#0047ab" }
  ],
  ML: [
    { code: "orange-ml", name: "Orange", flag: "🇲🇱", prefix: "+223", hint: "76 XX XX XX",    color: "#ff6600" },
    { code: "moov-ml",   name: "Moov",   flag: "🇲🇱", prefix: "+223", hint: "65 XX XX XX",    color: "#0047ab" }
  ],
  NE: [
    { code: "airtel-ne", name: "Airtel", flag: "🇳🇪", prefix: "+227", hint: "96 XX XX XX",    color: "#dc143c" }
  ],
  GN: [
    { code: "orange-gn", name: "Orange", flag: "🇬🇳", prefix: "+224", hint: "62 XX XX XX",    color: "#ff6600" }
  ],
  FR: [
    { code: "cb-fr",     name: "Carte bancaire", flag: "🇫🇷", prefix: "+33", hint: "XX XX XX XX XX", color: "#1a56db" }
  ],
  OTHER: [
    { code: "other",     name: "Autre",  flag: "🌍", prefix: "+",     hint: "Numéro complet",  color: "#6d28d9" }
  ]
}

// ── COULEURS CSS ──────────────────────────────────────────────
export const CSS_VARS = {
  light: {
    bg: "#fafaf8", bg2: "#f2f1ee", bg3: "#e8e6e0",
    panel: "#fff", border: "#e0ddd6",
    text: "#0f0e0c", text2: "#4a4840", text3: "#9a9890",
    accent: "#1a56db", al: "#eff3ff", am: "#bfcffb",
    green: "#057a55", gl: "#edfaf4", gm: "#9fe0c4",
    red: "#c81c1c", rl: "#fff1f1",
    purple: "#6d28d9", pl: "#f5f0ff",
    gold: "#b45309", goldl: "#fef3c7"
  },
  dark: {
    bg: "#0d0d11", bg2: "#141419", bg3: "#1c1c24",
    panel: "#18181f", border: "#28283a",
    text: "#eeeef4", text2: "#a8a8c0", text3: "#606078",
    al: "#16203a", am: "#243070",
    gl: "#0c2018", gm: "#184030",
    rl: "#280e0e", pl: "#1a1040", goldl: "#281a04"
  }
}

// ── UTILITAIRES EXPORTÉS ──────────────────────────────────────

/**
 * Formate un prix selon la devise
 * @param {number} price
 * @param {string} devise - XOF | EUR | USD
 * @returns {string}
 */
export function fp(price, devise = "XOF") {
  const n = parseFloat(price)
  if (!n && n !== 0) return "0"
  if (devise === "EUR") return n.toFixed(2).replace(".", ",") + " €"
  if (devise === "USD") return "$" + n.toFixed(2)
  return n.toLocaleString("fr") + " F"
}

/**
 * Temps relatif depuis une date ISO
 * @param {string} dateISO
 * @returns {string}
 */
export function timeAgo(dateISO) {
  const s = Math.floor((new Date() - new Date(dateISO)) / 1000)
  if (s < 60)    return "À l'instant"
  if (s < 3600)  return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`
  return new Date(dateISO).toLocaleDateString("fr", { day: "numeric", month: "short" })
}

/**
 * Échappe le HTML pour éviter les injections XSS
 * @param {string} text
 * @returns {string}
 */
export function escHtml(text) {
  const d = document.createElement("div")
  d.appendChild(document.createTextNode(text || ""))
  return d.innerHTML
}

/**
 * Traduit les erreurs Supabase Auth en français
 * @param {string} msg
 * @returns {string}
 */
export function trErr(msg) {
  if (!msg) return "Erreur inconnue."
  const m = msg.toLowerCase()
  if (m.includes("already registered"))           return "Cet email est déjà utilisé. Connecte-toi."
  if (m.includes("invalid login"))                return "Email ou mot de passe incorrect."
  if (m.includes("invalid credentials"))          return "Email ou mot de passe incorrect."
  if (m.includes("too many"))                     return "Trop de tentatives. Attends quelques minutes."
  if (m.includes("email not confirmed"))          return "Confirme ton email avant de te connecter."
  if (m.includes("weak password"))                return "Mot de passe trop faible (min. 6 caractères)."
  if (m.includes("user not found"))               return "Aucun compte avec cet email."
  return "Erreur. Réessaie dans un instant."
}

/**
 * Affiche un toast de notification
 * @param {string} msg
 * @param {'ok'|'err'|'dark'} type
 */
export function toast(msg, type = "dark") {
  let t = document.getElementById("ln-toast")
  if (!t) {
    t = document.createElement("div")
    t.id = "ln-toast"
    t.style.cssText = [
      "position:fixed", "bottom:24px", "right:80px",
      "padding:12px 22px", "border-radius:12px",
      "font-size:.84rem", "z-index:9999",
      "transform:translateY(80px)",
      "transition:all .35s cubic-bezier(.34,1.56,.64,1)",
      "font-family:'DM Sans',sans-serif", "font-weight:500",
      "box-shadow:0 16px 48px rgba(0,0,0,.22)",
      "max-width:320px", "line-height:1.5"
    ].join(";")
    document.body.appendChild(t)
  }
  const BG = { dark: "#09090f", ok: "#057a55", err: "#c81c1c" }
  t.style.background = BG[type] || BG.dark
  t.style.color = "#fff"
  t.textContent  = msg
  t.style.transform = "translateY(0)"
  clearTimeout(t._t)
  t._t = setTimeout(() => { t.style.transform = "translateY(80px)" }, 3800)
}

/**
 * Gestion du dark mode — à appeler au chargement + sur le bouton
 */
export function initTheme() {
  const saved = localStorage.getItem("ln_theme") || "light"
  document.documentElement.setAttribute("data-theme", saved)
  const btn = document.getElementById("themeBtn")
  if (btn) btn.textContent = saved === "dark" ? "☀️" : "🌙"
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme")
  const next    = current === "dark" ? "light" : "dark"
  document.documentElement.setAttribute("data-theme", next)
  localStorage.setItem("ln_theme", next)
  const btn = document.getElementById("themeBtn")
  if (btn) btn.textContent = next === "dark" ? "☀️" : "🌙"
}

/**
 * Anime un nombre de 0 à target
 * @param {string} elementId
 * @param {number} target
 */
export function animNum(elementId, target) {
  const el = document.getElementById(elementId)
  if (!el) return
  const t = Math.max(target, 1)
  let i = 0
  const iv = setInterval(() => {
    i++
    el.textContent = Math.round(t * (i / 20)).toLocaleString("fr")
    if (i >= 20) { el.textContent = target.toLocaleString("fr"); clearInterval(iv) }
  }, 30)
}

/**
 * Charge le profil de l'utilisateur connecté
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getProfile(userId) {
  const { data } = await SB.from("profiles").select("*").eq("id", userId).single()
  return data || null
}

/**
 * Met à jour la navbar selon l'état de connexion
 * Met à jour les éléments #navGuest, #navUser, #navName, #navAv
 */
export function updateNav(user, profile) {
  const guestEl = document.getElementById("navGuest")
  const userEl  = document.getElementById("navUser")
  const nameEl  = document.getElementById("navName")
  const avEl    = document.getElementById("navAv")

  if (!user) {
    if (guestEl) guestEl.style.display = "flex"
    if (userEl)  userEl.style.display  = "none"
    return
  }

  const prenom = profile?.prenom
    || user.user_metadata?.prenom
    || user.email?.split("@")[0]
    || "Toi"

  if (guestEl) guestEl.style.display = "none"
  if (userEl)  userEl.style.display  = "flex"
  if (nameEl)  nameEl.textContent    = prenom

  if (avEl) {
    if (profile?.photo_url) {
      avEl.innerHTML = `<img src="${profile.photo_url}" alt="${prenom}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
    } else {
      avEl.textContent = prenom.charAt(0).toUpperCase()
    }
  }
}

/**
 * Inscription rapide
 */
export async function signUp(prenom, email, password) {
  const { data, error } = await SB.auth.signUp({
    email,
    password,
    options: { data: { prenom } }
  })
  if (error) throw new Error(trErr(error.message))

  if (data.user) {
    await SB.from("profiles")
      .upsert({ id: data.user.id, prenom, email, role: "student", score_total: 0 })
      .catch(() => {})
    await SB.rpc("increment_stat", { stat_name: "total_inscrits" }).catch(() => {})
  }

  return data.user
}

/**
 * Connexion rapide
 */
export async function signIn(email, password) {
  const { data, error } = await SB.auth.signInWithPassword({ email, password })
  if (error) throw new Error(trErr(error.message))
  return data.user
}

/**
 * Déconnexion
 */
export async function signOut() {
  await SB.auth.signOut()
}

// ── MÉTADONNÉES DU SITE ───────────────────────────────────────
export const SITE = {
  name:    "Learnova",
  url:     "https://learnova-ashy.vercel.app",
  email:   "support@learnova.io",
  adminPw: "Learnova@Admin2025",
  colors: {
    accent: "#1a56db",
    green:  "#057a55",
    red:    "#c81c1c",
    purple: "#6d28d9"
  }
}

// ── PAYS DISPONIBLES ──────────────────────────────────────────
export const COUNTRIES = [
  { code: "BJ", name: "Bénin",         flag: "🇧🇯" },
  { code: "SN", name: "Sénégal",        flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire",  flag: "🇨🇮" },
  { code: "TG", name: "Togo",           flag: "🇹🇬" },
  { code: "BF", name: "Burkina Faso",   flag: "🇧🇫" },
  { code: "ML", name: "Mali",           flag: "🇲🇱" },
  { code: "NE", name: "Niger",          flag: "🇳🇪" },
  { code: "GN", name: "Guinée",         flag: "🇬🇳" },
  { code: "FR", name: "France",         flag: "🇫🇷" },
  { code: "OTHER", name: "Autre pays",  flag: "🌍" }
]

console.log("✅ Learnova Config chargée — Backend:", BACKEND, "| FedaPay sandbox:", FEDAPAY_SANDBOX)
