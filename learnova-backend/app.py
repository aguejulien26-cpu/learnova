# ============================================================
# LEARNOVA — Backend Python avec OpenAI (GPT-4o)
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI # Import OpenAI
import PyPDF2
import os
import io
import json

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration d'OpenAI
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

def ask_openai(prompt):
    """Envoie une requête à GPT-4o et retourne le texte."""
    response = client.chat.completions.create(
        model="gpt-4o", # Le modèle le plus performant en 2026
        messages=[
            {"role": "system", "content": "Tu es l'expert pédagogique de Learnova. Tu réponds uniquement en JSON quand c'est demandé."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" } # FORCE la réponse en JSON pur
    )
    return response.choices[0].message.content

# Exemple de la route d'analyse PDF mise à jour
@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    # ... (Le code d'extraction du texte PDF reste le même que ton ancien fichier)
    
    prompt = f"""Analyse ce cours : "{titre}". 
    Génère un JSON avec : resume, concepts_cles, chapitres, quiz (10 questions).
    CONTENU : {texte[:15000]}"""

    try:
        # Avec OpenAI et response_format, plus besoin de nettoyer les ```json !
        reponse_json = ask_openai(prompt)
        data = json.loads(reponse_json)
        
        data.update({"status": "success", "titre": titre})
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ... (Applique la même logique ask_openai pour tes autres routes)