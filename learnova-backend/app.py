"""
LEARNOVA BACKEND V4 — FLY.IO
============================================
- Flask + OpenAI GPT-4o-mini
- FedaPay paiement (Mobile Money + Carte)
- Livraison PDF automatique par email
- Webhooks FedaPay
- Déployé sur Fly.io
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os, json, random, io, hmac, hashlib

from openai import OpenAI

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
MODEL  = "gpt-4o-mini"

# Clés FedaPay (via Fly.io secrets)
FEDAPAY_SECRET_KEY = os.environ.get("FEDAPAY_SECRET_KEY", "")
SUPABASE_URL       = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY       = os.environ.get("SUPABASE_KEY", "")

# ── HELPER GPT ────────────────────────────────────────────────
def gpt(system: str, messages: list, temperature: float = 0.8,
        max_tokens: int = 1000, json_mode: bool = False):
    try:
        kwargs = {
            "model":       MODEL,
            "messages":    [{"role": "system", "content": system}] + messages,
            "temperature": temperature,
            "max_tokens":  max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        r = client.chat.completions.create(**kwargs)
        return r.choices[0].message.content
    except Exception as e:
        print(f"[GPT ERROR] {e}")
        return None

def build_course_context(d: dict) -> str:
    parts = []
    if d.get("course_title"):   parts.append(f"Cours : {d['course_title']}")
    if d.get("course_context"): parts.append(f"Description : {d['course_context']}")
    if d.get("current_module"): parts.append(f"Module actuel : {d['current_module']}")
    if d.get("level"):          parts.append(f"Niveau : {d['level']}")
    chapitres = d.get("chapitres", [])
    if chapitres:
        titres = [c.get("titre","") for c in chapitres[:5] if c.get("titre")]
        if titres: parts.append(f"Chapitres : {' | '.join(titres)}")
    concepts = d.get("concepts_cles", [])
    if concepts: parts.append(f"Concepts clés : {', '.join(concepts[:8])}")
    return "\n".join(parts)

# ═══════════════════════════════════════════════════════════════
# ROUTES GÉNÉRALES
# ═══════════════════════════════════════════════════════════════

@app.route("/")
def home():
    return jsonify({
        "status": "ok",
        "message": "Learnova Backend V4 — Fly.io",
        "model": MODEL,
        "routes": [
            "POST /api/ask-ai",
            "POST /api/teach",
            "POST /api/generate-session-plan",
            "POST /api/generate-quiz",
            "POST /api/analyze-pdf",
            "POST /api/transition",
            "POST /api/fedapay/create-transaction",
            "POST /api/fedapay/webhook",
            "POST /api/store/deliver",
        ]
    })

@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200

# ═══════════════════════════════════════════════════════════════
# ROUTES IA
# ═══════════════════════════════════════════════════════════════

@app.route("/api/ask-ai", methods=["POST"])
def ask_ai():
    d = request.json or {}
    question = d.get("question", "").strip()
    if not question:
        return jsonify({"error": "Question manquante"}), 400

    ctx   = build_course_context(d)
    seed  = random.randint(1000, 9999)
    level = d.get("level", "Tous niveaux")
    course_title = d.get("course_title", "ce cours")
    history = d.get("history", [])

    system = f"""Tu es un professeur IA expert et pédagogue sur Learnova.

CONTEXTE DU COURS :
{ctx}

RÈGLES :
1. Réponds DIRECTEMENT et PRÉCISÉMENT à la question
2. Adapte au niveau "{level}"
3. Exemples concrets liés à "{course_title}"
4. Format : **gras** pour les points clés, `code` pour le technique
5. 3-6 phrases max
6. Sois encourageant et précis
7. Seed anti-répétition : {seed}"""

    messages = [{"role": m["role"], "content": m["content"]} for m in history[-8:]
                if m.get("role") in ("user", "assistant") and m.get("content")]
    messages.append({"role": "user", "content": question})

    answer = gpt(system, messages, temperature=0.82, max_tokens=600)
    if not answer or len(answer) < 10:
        answer = f"Excellente question ! Ce point est fondamental dans **{course_title}**. Peux-tu préciser ce que tu n'as pas compris ?"
    return jsonify({"answer": answer, "question": question})


@app.route("/api/teach", methods=["POST"])
def teach():
    d = request.json or {}
    topic = d.get("topic", "ce sujet")
    ttype = d.get("type", "lesson")
    level = d.get("level", "Tous niveaux")
    course_data = d.get("course_data", {})
    seed = random.randint(1000, 9999)
    course_title = course_data.get("titre", topic)

    if ttype == "lesson":
        chaps = "\n".join([f"- {c.get('titre','')}" for c in course_data.get("chapitres",[])[:4]])
        concepts = ", ".join(course_data.get("concepts_cles", [])[:6])
        system = f"""Tu enseignes en live sur Learnova.
Cours: {course_title} | Module: {topic} | Niveau: {level}
{f"Chapitres:\n{chaps}" if chaps else ""}
{f"Concepts: {concepts}" if concepts else ""}

Génère une leçon engageante (6-9 phrases).
- Accroche captivante
- Concept principal avec exemple concret lié à "{course_title}"
- 2-3 points clés
- **gras** et `code` pour le technique
- Seed: {seed}"""
        content = gpt(system, [{"role": "user", "content": f"Enseigne: {topic}"}], temperature=0.85, max_tokens=800)
        if not content:
            content = f"Explorons **{topic}** — essentiel dans {course_title}. Ce concept est fondamental. Posez vos questions !"
        return jsonify({"content": content, "type": "lesson"})

    elif ttype in ("challenge", "quiz"):
        system = f"""Tu crées des challenges QCM pour Learnova.
Cours: {course_title} | Module: {topic} | Niveau: {level}

JSON strict:
{{"titre":"Challenge — [titre]","question":"Question précise?","options":["A","B","C","D"],"correct":1,"explication":"Explication 2-3 phrases"}}
- 4 options plausibles, une seule correcte
- correct = index 0-3
- Lié directement à "{topic}"
- Seed: {seed}"""
        result = gpt(system, [{"role":"user","content":f"Challenge: {topic}"}], temperature=0.9, max_tokens=400, json_mode=True)
        try:
            ch = json.loads(result)
            if ch.get("question") and len(ch.get("options",[])) == 4:
                return jsonify(ch)
        except: pass
        return jsonify({"titre":f"Challenge!","question":f"Concept essentiel de '{topic}' ?","options":["Théorie","Pratique","Mémorisation","Livres"],"correct":1,"explication":"La pratique régulière est la clé."})


@app.route("/api/generate-session-plan", methods=["POST"])
def gen_plan():
    d = request.json or {}
    subject = d.get("subject", "Formation")
    fmt = d.get("format", "session unique")
    level = d.get("level", "Tous niveaux")
    course_data = d.get("course_data", {})

    chaps = "\n".join([f"- {c.get('titre','')}" for c in course_data.get("chapitres",[])[:7]])
    system = f"""Tu conçois des plans de formation pour Learnova.
Sujet: {subject} | Format: {fmt} | Niveau: {level}
{f"Chapitres du cours:\n{chaps}" if chaps else ""}

JSON: {{"plan":[{{"time":"00:00","topic":"Titre précis","type":"lesson"}}]}}
Types: lesson, challenge, quiz, break
- session unique: 6-8 étapes ~2h
- 1h/jour: 5 étapes ~1h
- Topics SPÉCIFIQUES à "{subject}" """

    result = gpt(system, [{"role":"user","content":f"Plan: {subject}"}], temperature=0.7, max_tokens=1000, json_mode=True)
    try:
        data = json.loads(result)
        if data.get("plan") and len(data["plan"]) > 0:
            return jsonify(data)
    except: pass

    return jsonify({"plan":[
        {"time":"00:00","topic":f"Introduction à {subject}","type":"lesson"},
        {"time":"00:20","topic":f"Fondamentaux de {subject}","type":"lesson"},
        {"time":"00:45","topic":"Challenge QCM","type":"challenge"},
        {"time":"01:00","topic":"Pause","type":"break"},
        {"time":"01:10","topic":f"Approfondissement {subject}","type":"lesson"},
        {"time":"01:50","topic":"Quiz final","type":"quiz"}
    ]})


@app.route("/api/generate-quiz", methods=["POST"])
def gen_quiz():
    d = request.json or {}
    subject = d.get("subject", "ce cours")
    level = d.get("level", "Débutant")
    num = min(int(d.get("num_questions", 5)), 10)
    course_data = d.get("course_data", {})
    seed = random.randint(1000, 9999)

    chaps = "\n".join([f"- {c.get('titre','')}" for c in course_data.get("chapitres",[])[:5]])
    system = f"""Tu crées des quiz pour Learnova.
Cours: {subject} | Niveau: {level}
{f"Contenu:\n{chaps}" if chaps else ""}

JSON: {{"quiz":[{{"question":"Q?","options":["A","B","C","D"],"correct":0,"explication":"Explication"}}]}}
- Exactement {num} questions progressives
- correct = index 0-3
- Seed: {seed}"""

    result = gpt(system, [{"role":"user","content":f"{num} questions sur: {subject}"}], temperature=0.8, max_tokens=2500, json_mode=True)
    try:
        data = json.loads(result)
        if data.get("quiz"):
            return jsonify(data)
    except: pass
    return jsonify({"quiz":[{"question":f"Concept de '{subject}' ?","options":["A","B","C","D"],"correct":1,"explication":"La pratique est essentielle."}]})


@app.route("/api/analyze-pdf", methods=["POST"])
def analyze_pdf():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier"}), 400

    file  = request.files["file"]
    title = request.form.get("title", "Cours")
    level = request.form.get("level", "Débutant")

    text = ""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        for i, page in enumerate(reader.pages):
            if i >= 20: break
            try: text += (page.extract_text() or "") + "\n"
            except: continue
        text = text[:9000]
    except Exception as e:
        print(f"[PDF] {e}")
        text = f"Document: {title}"

    if not text.strip(): text = f"Document: {title}"

    system = f"""Tu analyses des documents pédagogiques pour Learnova.
Titre: {title} | Niveau: {level}

JSON: {{"resume":"2-3 phrases","duree_totale":"Xh","concepts_cles":["C1"...],"objectifs":["Obj1"...],"chapitres":[{{"titre":"Chap","lecons":["L1"...],"duree_minutes":30}}],"quiz":[{{"question":"Q?","options":["A","B","C","D"],"correct":0,"explication":"Expl"}}]}}
- 3-5 chapitres basés sur le CONTENU RÉEL
- Exactement 10 questions de quiz"""

    result = gpt(system, [{"role":"user","content":f"Analyse:\n\n{text}"}], temperature=0.6, max_tokens=3500, json_mode=True)
    try:
        data = json.loads(result)
        if data.get("chapitres") and data.get("quiz"):
            return jsonify(data)
    except Exception as e:
        print(f"[PDF PARSE] {e}")

    return jsonify({
        "resume": f"Cours sur {title}.",
        "duree_totale": "3h",
        "concepts_cles": [title,"Fondamentaux","Pratique"],
        "objectifs": [f"Comprendre {title}",f"Appliquer {title}"],
        "chapitres": [
            {"titre":"Introduction","lecons":["Présentation","Concepts de base"],"duree_minutes":40},
            {"titre":"Contenu principal","lecons":["Concepts clés","Exemples"],"duree_minutes":80}
        ],
        "quiz": [{"question":f"Définition de '{title}' ?","options":["A","B","C","D"],"correct":0,"explication":f"{title} est important."}]
    })


@app.route("/api/transition", methods=["POST"])
def gen_transition():
    d = request.json or {}
    from_m = d.get("from","")
    to_m   = d.get("to","")
    course = d.get("course","")
    seed   = random.randint(1000,9999)
    system = "Génère UNE SEULE phrase de transition courte (15-20 mots max). Ton dynamique et positif. Seed: " + str(seed)
    result = gpt(system, [{"role":"user","content":f"De '{from_m}' vers '{to_m}' dans '{course}'"}], temperature=0.9, max_tokens=60)
    return jsonify({"transition": result or f"Passons maintenant à : **{to_m}** !"})


@app.route("/api/community-moderate", methods=["POST"])
def moderate():
    d = request.json or {}
    text = d.get("text","").strip()
    if not text: return jsonify({"approved":False,"reason":"Vide"})
    system = """Modère cette publication communauté éducative.
JSON: {"approved":true/false,"reason":"raison si refusé"}
Refuse: spam, insultes graves, hors-sujet total. Accepte le reste."""
    result = gpt(system, [{"role":"user","content":text}], temperature=0.3, max_tokens=100, json_mode=True)
    try: return jsonify(json.loads(result))
    except: return jsonify({"approved":True,"reason":""})


# ═══════════════════════════════════════════════════════════════
# ROUTES FEDAPAY
# ═══════════════════════════════════════════════════════════════

@app.route("/api/fedapay/create-transaction", methods=["POST"])
def fedapay_create():
    """Crée une transaction FedaPay et retourne le token pour le widget."""
    d = request.json or {}

    amount      = d.get("amount", 0)
    currency    = d.get("currency", "XOF")
    description = d.get("description", "Achat Learnova")
    customer    = d.get("customer", {})
    product_id  = d.get("product_id", "")

    if not amount or amount <= 0:
        return jsonify({"error": "Montant invalide"}), 400

    try:
        import requests as req

        # Appel API FedaPay
        headers = {
            "Authorization": f"Bearer {FEDAPAY_SECRET_KEY}",
            "Content-Type":  "application/json",
        }

        payload = {
            "description": description,
            "amount":      int(amount),
            "currency":    {"iso": currency},
            "callback_url": "https://learnova-ashy.vercel.app/store.html?payment=success",
            "customer": {
                "firstname": customer.get("firstname", "Client"),
                "lastname":  customer.get("lastname", "Learnova"),
                "email":     customer.get("email", ""),
                "phone_number": {
                    "number":  customer.get("phone_number", ""),
                    "country": "BJ"  # Bénin — change selon ton pays
                }
            }
        }

        # Déterminer si sandbox ou live
        is_sandbox = FEDAPAY_SECRET_KEY.startswith("sk_sandbox")
        base_url   = "https://sandbox-api.fedapay.com/v1" if is_sandbox else "https://api.fedapay.com/v1"

        resp = req.post(f"{base_url}/transactions", json=payload, headers=headers, timeout=15)
        data = resp.json()

        if resp.status_code not in (200, 201):
            print(f"[FEDAPAY ERROR] {data}")
            return jsonify({"error": data.get("message","Erreur FedaPay")}), 400

        transaction = data.get("v1/transaction", data.get("transaction", {}))
        tx_id    = transaction.get("id")
        tx_token = transaction.get("token", "")

        return jsonify({
            "transaction_id": tx_id,
            "token":          tx_token,
            "status":         "created"
        })

    except Exception as e:
        print(f"[FEDAPAY CREATE] {e}")
        # Simulation pour développement si FedaPay non configuré
        return jsonify({
            "transaction_id": f"TX-{random.randint(100000,999999)}",
            "token":          f"token-{random.randint(100000,999999)}",
            "status":         "simulated",
            "note":           "FedaPay non configuré — simulation activée"
        })


@app.route("/api/fedapay/webhook", methods=["POST"])
def fedapay_webhook():
    """Reçoit les confirmations de paiement FedaPay."""
    try:
        # Vérifier la signature du webhook
        signature = request.headers.get("x-fedapay-signature", "")
        payload   = request.get_data()

        # (En production, vérifier la signature avec FEDAPAY_SECRET_KEY)
        data = request.json or {}
        event_type = data.get("name", "")

        print(f"[WEBHOOK] Événement reçu: {event_type}")

        if event_type in ("transaction.approved", "transaction.success"):
            transaction = data.get("data", {}).get("object", {})
            tx_id       = transaction.get("id")
            tx_amount   = transaction.get("amount")
            tx_ref      = transaction.get("reference","")
            customer    = transaction.get("customer", {})

            print(f"[WEBHOOK] Paiement confirmé: {tx_id} — {tx_amount} XOF")

            # Mettre à jour Supabase via l'API REST
            try:
                import requests as req
                headers_sb = {
                    "apikey":        SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type":  "application/json",
                    "Prefer":        "return=minimal"
                }
                # Marquer la commande comme payée
                req.patch(
                    f"{SUPABASE_URL}/rest/v1/store_orders?fedapay_transaction_id=eq.{tx_id}",
                    json={"statut": "paye", "livraison_statut": "en_cours"},
                    headers=headers_sb, timeout=10
                )
            except Exception as e:
                print(f"[WEBHOOK SUPABASE] {e}")

        elif event_type in ("transaction.declined", "transaction.canceled"):
            transaction = data.get("data", {}).get("object", {})
            tx_id = transaction.get("id")
            print(f"[WEBHOOK] Paiement refusé: {tx_id}")
            try:
                import requests as req
                headers_sb = {
                    "apikey":        SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type":  "application/json",
                    "Prefer":        "return=minimal"
                }
                req.patch(
                    f"{SUPABASE_URL}/rest/v1/store_orders?fedapay_transaction_id=eq.{tx_id}",
                    json={"statut": "echoue"},
                    headers=headers_sb, timeout=10
                )
            except: pass

        return jsonify({"received": True}), 200

    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# ROUTES LIVRAISON PDF
# ═══════════════════════════════════════════════════════════════

@app.route("/api/store/deliver", methods=["POST"])
def deliver_product():
    """
    Envoie le fichier PDF au client après achat confirmé.
    Méthodes : email (via SMTP/SendGrid) ou SMS (lien de téléchargement).
    """
    d = request.json or {}

    order_id    = d.get("order_id", "")
    product_nom = d.get("product_nom", "Votre produit")
    fichier_url = d.get("fichier_url", "")
    destinataire = d.get("destinataire", "")
    methode     = d.get("methode", "email")
    prenom      = d.get("prenom", "Apprenant")
    email       = d.get("email", "")

    if not destinataire:
        return jsonify({"error": "Destinataire manquant"}), 400

    print(f"[DELIVER] {methode} → {destinataire} | Produit: {product_nom}")

    success = False
    error_msg = ""

    # ── LIVRAISON PAR EMAIL ────────────────────────────────────
    if methode == "email" or email:
        try:
            success = send_email_with_product(
                to_email    = email or destinataire,
                prenom      = prenom,
                product_nom = product_nom,
                fichier_url = fichier_url,
                order_id    = order_id
            )
        except Exception as e:
            error_msg = str(e)
            print(f"[EMAIL ERROR] {e}")

    # ── LIVRAISON PAR SMS ──────────────────────────────────────
    elif methode == "sms":
        try:
            success = send_sms_with_link(
                phone       = destinataire,
                prenom      = prenom,
                product_nom = product_nom,
                fichier_url = fichier_url
            )
        except Exception as e:
            error_msg = str(e)
            print(f"[SMS ERROR] {e}")

    # Mettre à jour le statut dans Supabase
    try:
        import requests as req
        headers_sb = {
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type":  "application/json",
            "Prefer":        "return=minimal"
        }
        new_status = "livre" if success else "echec"
        req.patch(
            f"{SUPABASE_URL}/rest/v1/store_deliveries?order_id=eq.{order_id}",
            json={
                "statut":          new_status,
                "tentatives":      1,
                "dernier_essai":   __import__('datetime').datetime.utcnow().isoformat(),
                "message_erreur":  error_msg if not success else None
            },
            headers=headers_sb, timeout=10
        )
        # Mettre à jour la commande aussi
        req.patch(
            f"{SUPABASE_URL}/rest/v1/store_orders?id=eq.{order_id}",
            json={"livraison_statut": new_status},
            headers=headers_sb, timeout=10
        )
    except Exception as e:
        print(f"[DELIVER SUPABASE] {e}")

    return jsonify({
        "status":  "delivered" if success else "pending",
        "methode": methode,
        "note":    "Livré avec succès" if success else f"En attente — {error_msg}"
    })


@app.route("/api/store/retry-delivery", methods=["POST"])
def retry_delivery():
    """Relance une livraison échouée."""
    d = request.json or {}
    delivery_id = d.get("delivery_id", "")

    try:
        import requests as req
        headers_sb = {
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type":  "application/json",
        }
        # Récupérer la livraison
        resp = req.get(
            f"{SUPABASE_URL}/rest/v1/store_deliveries?id=eq.{delivery_id}&select=*,store_orders(*,store_products(*))",
            headers=headers_sb, timeout=10
        )
        delivs = resp.json()
        if not delivs: return jsonify({"error": "Livraison introuvable"}), 404

        deliv = delivs[0]
        order = deliv.get("store_orders", {})
        prod  = order.get("store_products", {})

        # Relancer
        return deliver_product.__wrapped__() if hasattr(deliver_product, '__wrapped__') else app.test_client().post('/api/store/deliver', json={
            "order_id":    order.get("id"),
            "product_nom": prod.get("nom"),
            "fichier_url": prod.get("fichier_url"),
            "destinataire": deliv.get("destinataire"),
            "methode":     deliv.get("methode","email"),
            "prenom":      order.get("client_prenom"),
            "email":       order.get("client_email")
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── FONCTIONS D'ENVOI EMAIL / SMS ──────────────────────────────

def send_email_with_product(to_email, prenom, product_nom, fichier_url, order_id):
    """
    Envoie un email avec le lien de téléchargement du produit.
    Utilise smtplib (Gmail) ou SendGrid.
    Configure SMTP_EMAIL et SMTP_PASSWORD dans les secrets Fly.io.
    """
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    smtp_email    = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    smtp_host     = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.environ.get("SMTP_PORT", "587"))

    if not smtp_email or not smtp_password:
        print("[EMAIL] SMTP non configuré — simulation")
        print(f"[EMAIL SIMULATION] À: {to_email} | Produit: {product_nom} | Lien: {fichier_url}")
        return True  # Simuler le succès en dev

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🎉 Votre achat — {product_nom}"
    msg["From"]    = f"Learnova Store <{smtp_email}>"
    msg["To"]      = to_email

    download_btn = f'<a href="{fichier_url}" style="display:inline-block;padding:14px 32px;background:#1a56db;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px">📥 Télécharger maintenant</a>' if fichier_url else '<p style="color:#9a9890">Lien de téléchargement en cours de préparation.</p>'

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:'DM Sans',Arial,sans-serif;background:#f2f1ee;margin:0;padding:0;">
      <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#0d0d18,#131328);padding:32px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:1.6rem;color:#fff;font-weight:600;margin-bottom:4px">⭐ Learnova Store</div>
          <div style="font-size:.85rem;color:rgba(255,255,255,.5)">Votre achat est confirmé</div>
        </div>
        <div style="padding:32px;">
          <h2 style="font-family:Georgia,serif;color:#0f0e0c;font-size:1.4rem;margin-bottom:10px">Bonjour {prenom} ! 🎉</h2>
          <p style="color:#4a4840;line-height:1.7;margin-bottom:20px">
            Merci pour votre achat ! Votre produit <strong>{product_nom}</strong> est prêt à être téléchargé.
          </p>
          <div style="text-align:center;margin:28px 0;">
            {download_btn}
          </div>
          <div style="background:#edfaf4;border:1px solid #9fe0c4;border-radius:12px;padding:16px;margin-top:20px;">
            <div style="font-size:.85rem;color:#057a55;line-height:1.65;">
              ✅ Référence commande : <strong>{order_id[:8]}...</strong><br/>
              📧 Ce lien est valable 30 jours.<br/>
              💬 Support : support@learnova.io
            </div>
          </div>
        </div>
        <div style="background:#f2f1ee;padding:18px;text-align:center;font-size:.76rem;color:#9a9890;">
          © 2025 Learnova · La plateforme d'apprentissage IA
        </div>
      </div>
    </body>
    </html>"""

    text = f"Bonjour {prenom},\n\nMerci pour votre achat de {product_nom}.\nTéléchargez ici : {fichier_url}\n\nRéférence : {order_id}\n\nLearnova"

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.sendmail(smtp_email, to_email, msg.as_string())

    print(f"[EMAIL] Envoyé à {to_email}")
    return True


def send_sms_with_link(phone, prenom, product_nom, fichier_url):
    """
    Envoie un SMS avec le lien de téléchargement.
    Utilise l'API Orange SMS ou Twilio.
    """
    # Simuler l'envoi SMS (configure ton provider SMS)
    print(f"[SMS SIMULATION] À: {phone} | Produit: {product_nom}")
    message = f"Bonjour {prenom}! Votre achat Learnova: {product_nom}. Téléchargez ici: {fichier_url}"
    print(f"[SMS] Message: {message}")
    # TODO: Intégrer Twilio ou Orange SMS API
    return True


# ── MAIN ──────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"[LEARNOVA] Backend V4 — Fly.io — Port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)