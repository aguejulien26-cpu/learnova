# ============================================================
# LEARNOVA — Backend Python avec Google Gemini (Optimisé 2026)
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import PyPDF2
import os
import io
import json

app = Flask(__name__)
# Autorise toutes les origines pour éviter les erreurs CORS au déploiement
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration Gemini avec le nom de modèle stable
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
# Correction du nom du modèle pour éviter l'erreur 404
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

def ask_gemini(prompt):
    """Envoie une requête à l'IA et retourne le texte brut."""
    response = model.generate_content(prompt)
    return response.text.strip()

def clean_json_response(text):
    """Nettoie les balises Markdown ```json ... ``` pour extraire le JSON pur."""
    text = text.strip()
    if text.startswith("```"):
        # On enlève la première ligne (```json) et la dernière (```)
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "ok",
        "message": "Learnova Backend Gemini est en ligne et optimisé !"
    })

@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier reçu"}), 400
    
    fichier = request.files['file']
    titre = request.form.get('title', 'Cours sans titre')
    niveau = request.form.get('level', 'Débutant')

    try:
        lecteur_pdf = PyPDF2.PdfReader(io.BytesIO(fichier.read()))
        texte = ""
        for i, page in enumerate(lecteur_pdf.pages):
            t = page.extract_text()
            if t:
                texte += f"\n[Page {i+1}]\n{t}"
        
        nb_pages = len(lecteur_pdf.pages)
        # On augmente un peu la limite pour avoir plus de contexte en 2026
        texte = texte[:12000] 
    except Exception as e:
        return jsonify({"error": f"Impossible de lire le PDF : {str(e)}"}), 400

    prompt = f"""Expert pédagogique Learnova. Analyse le document suivant : "{titre}"
Niveau cible : {niveau} | Pages : {nb_pages}
CONTENU : {texte}

Génère UNIQUEMENT un objet JSON (sans texte avant ou après) respectant cette structure exacte :
{{
  "resume": "Résumé pédagogique de 4 phrases",
  "concepts_cles": ["concept1", "concept2", "concept3"],
  "chapitres": [
    {{"numero": 1, "titre": "Introduction", "description": "Description", "lecons": ["L1", "L2"], "duree_minutes": 15}}
  ],
  "quiz": [
    {{"question": "Question 1?", "options": ["A", "B", "C", "D"], "correct": 0, "explication": "Pourquoi c'est A"}}
  ],
  "difficulte": "Intermédiaire",
  "duree_totale": "3h",
  "objectifs": ["Savoir définir X", "Comprendre Y"]
}}
Note : Génère 5 chapitres et 10 questions de quiz."""

    try:
        raw_reponse = ask_gemini(prompt)
        json_clean = clean_json_response(raw_reponse)
        data = json.loads(json_clean)
        
        data.update({
            "titre": titre,
            "nb_pages": nb_pages,
            "status": "success"
        })
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Erreur de traitement IA : {str(e)}"}), 500

@app.route('/api/ask-ai', methods=['POST'])
def ask_ai():
    d = request.json or {}
    question = d.get('question', '').strip()
    contexte = d.get('course_context', '')[:5000]
    titre = d.get('course_title', 'ce cours')

    if not question:
        return jsonify({"error": "Question vide"}), 400

    prompt = f"""Professeur expert Learnova. 
Cours : "{titre}"
Contexte : {contexte}
Question de l'étudiant : {question}
Réponds de manière structurée avec des exemples concrets, en français, maximum 3 paragraphes."""

    try:
        reponse = ask_gemini(prompt)
        return jsonify({"answer": reponse, "status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Les autres routes (generate-quiz, teach, etc.) suivent la même logique
# ... (Gardez vos autres routes en appliquant clean_json_response sur les résultats)

if __name__ == '__main__':
    # Utilisation du port fourni par l'hébergeur (Render, Heroku, etc.)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)