# ============================================================
# LEARNOVA — Backend Python (python-backend/app.py)
# ============================================================
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import PyPDF2
import io, json, os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "METS_TA_CLE_ICI"))

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "Learnova Backend actif !"})

@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier reçu"}), 400
    file = request.files['file']
    title = request.form.get('title', 'Cours sans titre')
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        text = "".join(p.extract_text() or "" for p in pdf_reader.pages)[:8000]
        pages = len(pdf_reader.pages)
    except Exception as e:
        return jsonify({"error": f"Impossible de lire le PDF : {e}"}), 400

    prompt = f"""Analyse ce cours "{title}" ({pages} pages) et génère UNIQUEMENT ce JSON :
{{
  "summary": "Résumé en 3 phrases",
  "key_concepts": ["concept1","concept2","concept3"],
  "chapters": [{{"number":1,"title":"Titre","lessons":["Leçon 1","Leçon 2"]}}],
  "quiz": [{{"question":"?","options":["A","B","C","D"],"correct":0,"explanation":"Explication"}}],
  "difficulty": "Débutant",
  "estimated_duration": "2h"
}}
Contenu : {text}
Génère 5 chapitres et 10 quiz. JSON uniquement, rien d'autre."""

    try:
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=4000,
                                     messages=[{"role":"user","content":prompt}])
        data = json.loads(msg.content[0].text)
        data.update({"title":title,"pages":pages,"status":"success"})
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    question = data.get('question','')
    context = data.get('course_context','')[:3000]
    title = data.get('course_title','ce cours')
    if not question:
        return jsonify({"error":"Question vide"}), 400
    prompt = f"""Tu es un professeur expert Learnova enseignant "{title}".
Contexte : {context}
Question : {question}
Réponds clairement, avec exemples si possible, en français, max 3 paragraphes."""
    try:
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=800,
                                     messages=[{"role":"user","content":prompt}])
        return jsonify({"answer":msg.content[0].text,"status":"success"})
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@app.route('/api/generate-session-plan', methods=['POST'])
def generate_session_plan():
    data = request.json
    subject = data.get('subject','')
    format_type = data.get('format','session unique')
    date = data.get('date','')
    time = data.get('time','20:00')
    prompt = f"""Génère un plan de session Learnova pour "{subject}" (format: {format_type}).
Réponds UNIQUEMENT avec ce JSON :
{{"plan":[{{"time":"00:00","topic":"Sujet","type":"lesson","duration_min":20}}],
"total_duration":"2h","challenges_count":2,"quiz_count":1}}
Types possibles: lesson, challenge, quiz, break. JSON uniquement."""
    try:
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=2000,
                                     messages=[{"role":"user","content":prompt}])
        return jsonify(json.loads(msg.content[0].text))
    except Exception as e:
        return jsonify({"error":str(e)}), 500

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    subject = data.get('subject','')
    level = data.get('level','Débutant')
    n = data.get('num_questions', 5)
    prompt = f"""Génère {n} questions quiz sur "{subject}" niveau {level}.
JSON uniquement : {{"quiz":[{{"question":"?","options":["A","B","C","D"],"correct":0,"explanation":"Explication"}}]}}"""
    try:
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=2000,
                                     messages=[{"role":"user","content":prompt}])
        return jsonify(json.loads(msg.content[0].text))
    except Exception as e:
        return jsonify({"error":str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
