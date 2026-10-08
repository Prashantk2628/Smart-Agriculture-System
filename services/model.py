# model.py
import sys
import os
import json
import pandas as pd
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 1. Dynamically resolve the path to the model files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'random_forest_pipeline.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'label_encoder.pkl')

model_pipeline = None
label_encoder = None

try:
    model_pipeline = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)
except Exception as e:
    pass

def predict_recommendations(data):
    if model_pipeline is None or label_encoder is None:
        raise ValueError("Machine Learning model files not loaded properly.")

    input_df = pd.DataFrame([{
        'N': int(data.get('N', 0)),
        'P': int(data.get('P', 0)),
        'K': int(data.get('K', 0)),
        'temperature': float(data.get('temperature', 0)),
        'humidity': float(data.get('humidity', 0)),
        'ph': float(data.get('ph', 0)),
        'rainfall': float(data.get('rainfall', 0))
    }])

    probabilities = model_pipeline.predict_proba(input_df)[0]
    top_indices = np.argsort(probabilities)[-5:][::-1]

    recommendations = []
    for idx in top_indices:
        crop_name = str(label_encoder.inverse_transform([idx])[0])
        confidence = float(round(probabilities[idx] * 100, 2))
        recommendations.append({
            "crop": crop_name,
            "confidence": confidence
        })
    return {"recommendations": recommendations}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json() or {}
        res = predict_recommendations(data)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    if len(sys.argv) > 1:
        try:
            input_arg = sys.argv[1]
            if os.path.exists(input_arg):
                with open(input_arg, 'r') as f:
                    data = json.load(f)
            else:
                data = json.loads(input_arg)
            res = predict_recommendations(data)
            print(json.dumps(res))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
        sys.exit(0)
    else:
        print("🚀 Starting Flask API server for Crop Recommendation on port 5000...")
        app.run(debug=True, port=5000)