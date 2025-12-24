from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle

app = Flask(__name__)
CORS(app) 

try:
    with open('model_data.pkl', 'rb') as f:
        artifacts = pickle.load(f)
    print("Models loaded successfully.")
except FileNotFoundError:
    print("Error: model_data.pkl not found. Run train_model.py first.")
    artifacts = None

def preprocess_input(data):
    if not artifacts:
        raise ValueError("Models not loaded")
        
    le_reputation = artifacts['le_reputation']
    le_content_type = artifacts['le_content_type']
    c_type = data.get('content_type', 'website') 
    try:
        c_type_enc = le_content_type.transform([c_type])[0]
    except ValueError:
         c_type_enc = le_content_type.transform(['website'])[0]
    rep = data.get('sender_reputation', 'unknown')
    try:
        rep_enc = le_reputation.transform([rep])[0]
    except ValueError:
        rep_enc = le_reputation.transform(['unknown'])[0]
        
    social_count = len(data.get('social_engineering_indicators', []))
    tech_count = len(data.get('technical_indicators', []))
    
    age = data.get('domain_age_estimate_days')
    if age is None or age == "null":
        age = 0 
    else:
        try:
            age = int(age)
        except:
            age = 0

    features = pd.DataFrame([{
        'content_type_encoded': c_type_enc,
        'domain_age_days': age,
        'sender_reputation_encoded': rep_enc,
        'num_social_eng_indicators': social_count,
        'num_tech_indicators': tech_count
    }])
    
    return features

@app.route('/predict', methods=['POST'])
def predict():
    if not artifacts:
        return jsonify({"error": "Model setup failed"}), 500
        
    data = request.json
    print(f"Received request: {data}")
    
    try:
        features = preprocess_input(data)
        
        score_model = artifacts['score_model']
        verdict_model = artifacts['verdict_model']
        
        risk_score = score_model.predict(features)[0]
        verdict_pred = verdict_model.predict(features)[0]
        
        risk_score = float(risk_score)
        verdict = str(verdict_pred)
        
        response = {
            "risk_score": round(risk_score),
            "verdict": verdict
        }

        
        return jsonify(response)
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e), "risk_score": 0, "verdict": "unknown"}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
