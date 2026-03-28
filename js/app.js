// ============================================================
// LEARNOVA — JavaScript partagé (js/app.js)
// Ce fichier est chargé par toutes les pages
// ============================================================

// ── NAVIGATION ──────────────────────────────────────────────
const LN = {
  go(page) { window.location.href = page; },
  goLive()    { window.location.href = 'live.html'; },
  goWaiting() { window.location.href = 'waiting.html'; },
  goAdmin()   { window.location.href = 'admin.html'; },
  goHome()    { window.location.href = 'index.html'; },
  goCourse()  { window.location.href = 'course.html'; },
};

// ── TOAST ───────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#09090f;color:#fff;padding:12px 18px;border-radius:10px;font-size:.83rem;box-shadow:0 20px 60px rgba(0,0,0,.15);z-index:9999;transform:translateY(80px);transition:transform .3s;display:flex;align-items:center;gap:10px;max-width:340px;font-family:"DM Sans",sans-serif;';
    document.body.appendChild(t);
  }
  const colors = { success: '#059669', error: '#dc2626', info: '#2563eb' };
  t.innerHTML = `<span style="width:18px;height:18px;border-radius:50%;background:${colors[type]||colors.success};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.65rem;">✓</span><span>${msg}</span>`;
  t.style.transform = 'translateY(0)';
  setTimeout(() => t.style.transform = 'translateY(80px)', 3500);
}

// ── COPY TO CLIPBOARD ────────────────────────────────────────
function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  });
  showToast('Lien copié dans le presse-papiers !');
}

// ── TIME UTILS ───────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
}
function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// ── SESSION STORAGE (données de session) ─────────────────────
const Store = {
  set(key, val) { try { localStorage.setItem('ln_'+key, JSON.stringify(val)); } catch(e) {} },
  get(key, def = null) {
    try { const v = localStorage.getItem('ln_'+key); return v ? JSON.parse(v) : def; } catch(e) { return def; }
  },
  del(key) { localStorage.removeItem('ln_'+key); }
};

// ── AI RESPONSES (réponses simulées de l'IA) ─────────────────
const AI_RESPONSES = [
  "Excellente question ! {q} — En termes simples : Python gère cela automatiquement, mais comprendre le mécanisme sous-jacent est crucial. La clé est de toujours vérifier avec <code>type()</code> ou <code>print()</code>.",
  "Très bonne observation ! Pour répondre à '{q}' : c'est l'un des concepts les plus importants. La règle d'or est : commence toujours par le cas le plus simple, puis généralise. As-tu essayé de coder un exemple ?",
  "C'est exactement le bon réflexe de poser cette question sur '{q}'. En pratique professionnelle, cette notion revient constamment. Je te conseille de créer un petit projet personnel pour ancrer ça.",
  "Bonne réflexion ! '{q}' — Voilà la réponse directe : le comportement dépend du contexte d'exécution. Dans la session d'aujourd'hui, on va voir exactement ce cas dans le prochain exercice.",
];
let aiRespIdx = 0;
function getAIResponse(question) {
  const r = AI_RESPONSES[aiRespIdx % AI_RESPONSES.length].replace(/{q}/g, question);
  aiRespIdx++;
  return r;
}

// ── PLAN TEMPLATES (formats de formation) ───────────────────
const PLAN_TEMPLATES = {
  '1h/jour': [
    { t:'00:00', topic:'Introduction & objectifs', type:'lesson', label:'Leçon' },
    { t:'00:15', topic:'Concept principal', type:'lesson', label:'Leçon' },
    { t:'00:35', topic:'Challenge QCM — 30 secondes', type:'challenge', label:'Challenge' },
    { t:'00:45', topic:'Exercice pratique', type:'lesson', label:'Leçon' },
    { t:'00:55', topic:'Quiz de clôture', type:'quiz', label:'Quiz' },
  ],
  '2h/semaine': [
    { t:'00:00', topic:'Rappel & introduction', type:'lesson', label:'Leçon' },
    { t:'00:20', topic:'Nouveau chapitre — théorie', type:'lesson', label:'Leçon' },
    { t:'00:50', topic:'Challenge collectif', type:'challenge', label:'Challenge' },
    { t:'01:05', topic:'Pause', type:'break', label:'Pause' },
    { t:'01:15', topic:'Pratique et exercices', type:'lesson', label:'Leçon' },
    { t:'01:45', topic:'Quiz final + classement', type:'quiz', label:'Quiz' },
  ],
  'session unique': [
    { t:'00:00', topic:'Présentation & objectifs', type:'lesson', label:'Leçon' },
    { t:'00:20', topic:'Module 1 — Fondations', type:'lesson', label:'Leçon' },
    { t:'00:50', topic:'Challenge #1 — QCM rapide', type:'challenge', label:'Challenge' },
    { t:'01:00', topic:'Pause 10 min', type:'break', label:'Pause' },
    { t:'01:10', topic:'Module 2 — Approfondissement', type:'lesson', label:'Leçon' },
    { t:'01:40', topic:'Défi final', type:'challenge', label:'Challenge' },
    { t:'01:55', topic:'Quiz de certification', type:'quiz', label:'Quiz' },
  ],
  '30h/mois': [
    { t:'Semaine 1', topic:'Fondations & concepts de base', type:'lesson', label:'Leçon' },
    { t:'Semaine 1', topic:'Premier projet pratique', type:'challenge', label:'Challenge' },
    { t:'Semaine 2', topic:'Approfondissement intermédiaire', type:'lesson', label:'Leçon' },
    { t:'Semaine 2', topic:'Quiz de mi-parcours', type:'quiz', label:'Quiz' },
    { t:'Semaine 3', topic:'Techniques avancées', type:'lesson', label:'Leçon' },
    { t:'Semaine 3', topic:'Projet collaboratif', type:'challenge', label:'Challenge' },
    { t:'Semaine 4', topic:'Révision + projet final', type:'lesson', label:'Leçon' },
    { t:'Semaine 4', topic:'Examen de certification', type:'quiz', label:'Quiz' },
  ],
};

// ── CHALLENGES DATA ──────────────────────────────────────────
const CHALLENGES = [
  {
    type:'QCM', title:'Challenge QCM — 30 secondes',
    sub:'Qui répond correctement le plus vite gagne 100 points !', time:30,
    q:'Quelle est la complexité du tri à bulles dans le pire des cas ?',
    opts:['O(n)','O(n log n)','O(n²)','O(log n)'], correct:2,
  },
  {
    type:'SPEED', title:'Qui répond le plus vite ?',
    sub:'Premier à répondre correctement = 200 points bonus !', time:20,
    q:'En Python, que retourne len([1, 2, 3, 4, 5]) ?',
    opts:['4','5','6','3'], correct:1,
  },
  {
    type:'VOTE', title:'Vote collectif — Votre opinion !',
    sub:'Tout le monde répond — pas de mauvaise réponse', time:45,
    q:'Selon vous, quel algorithme est le plus utile en pratique ?',
    opts:['Tri à bulles','Quicksort','Merge sort','Ça dépend'], correct:3,
  },
  {
    type:'QCM', title:'Challenge rapide !',
    sub:'30 secondes pour répondre !', time:30,
    q:'Quel mot-clé définit une fonction en Python ?',
    opts:['function','def','func','lambda'], correct:1,
  },
];
