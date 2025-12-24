import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle

def train_models():
    # 1. Load Data
    try:
        df = pd.read_csv('dataset.csv')
    except FileNotFoundError:
        print("Error: dataset.csv not found. Run generate_dataset.py first.")
        return

    # 2. Preprocessing
    le_reputation = LabelEncoder()
    df['sender_reputation_encoded'] = le_reputation.fit_transform(df['sender_reputation'])
    
    le_content_type = LabelEncoder()
    df['content_type_encoded'] = le_content_type.fit_transform(df['content_type'])

    # Features
    X = df[['content_type_encoded', 'domain_age_days', 'sender_reputation_encoded', 'num_social_eng_indicators', 'num_tech_indicators']]
    
    # Targets
    y_score = df['risk_score']
    y_verdict = df['verdict']

    # 3. Train Models
    print("Training Risk Score Regressor...")
    geo_score_model = RandomForestRegressor(n_estimators=100, random_state=42)
    geo_score_model.fit(X, y_score)
    
    print("Training Verdict Classifier...")
    verdict_model = RandomForestClassifier(n_estimators=100, random_state=42)
    verdict_model.fit(X, y_verdict)

    # 4. Save Artifacts
    artifacts = {
        'score_model': geo_score_model,
        'verdict_model': verdict_model,
        'le_reputation': le_reputation,
        'le_content_type': le_content_type
    }
    
    with open('model_data.pkl', 'wb') as f:
        pickle.dump(artifacts, f)
        
    print("Models and encoders saved to model_data.pkl")

if __name__ == "__main__":
    train_models()
