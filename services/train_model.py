# train_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# Use DOUBLE underscores: __file__
# BASE_DIR will be: D:\smart agriculture system\services
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Move up ONE level to the Project Root: D:\smart agriculture system
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Target the data folder: D:\smart agriculture system\data\merged_crop_dataset.csv
DATA_PATH = os.path.join(PROJECT_ROOT, 'data', 'merged_crop_dataset.csv')

MODEL_PATH = os.path.join(BASE_DIR, 'random_forest_pipeline.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'label_encoder.pkl')

print(f"⏳ Loading dataset from: {DATA_PATH}")

# Fallback: just in case the CSV is temporarily placed in the same folder as this script
if not os.path.exists(DATA_PATH):
    DATA_PATH = os.path.join(BASE_DIR, 'merged_crop_dataset.csv')

MODEL_PATH = os.path.join(BASE_DIR, 'random_forest_pipeline.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'label_encoder.pkl')

print(f"⏳ Loading dataset from: {DATA_PATH}")
try:
    df = pd.read_csv(DATA_PATH)
except FileNotFoundError:
    print(f"❌ Error: Dataset not found at {DATA_PATH}.")
    print("Please ensure 'merged_crop_dataset.csv' is placed in your project's 'data/' folder.")
    exit(1)

print("🧹 Preparing data...")
df = df.dropna()

# 2. Define Features (X) and Target (y)
X = df.drop(columns=['label'])
y = df['label']

# Encode the target crop labels into numbers
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# 3. Build the Pipeline
model_pipeline = Pipeline(steps=[
    ('classifier', RandomForestClassifier(
        n_estimators=200, 
        max_depth=12,         # Restrict depth to prevent overfitting
        random_state=42
    ))
])

# 4. Split the data into Training and Testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

print("🧠 Training Random Forest Model...")
model_pipeline.fit(X_train, y_train)

# 5. Evaluate the model
y_pred = model_pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"✅ Model trained successfully! Accuracy: {accuracy * 100:.2f}%")

# 6. Save the model and label encoder
print("💾 Saving model and encoder...")
joblib.dump(model_pipeline, MODEL_PATH)
joblib.dump(label_encoder, ENCODER_PATH)

print(f"🎉 All done! ML files successfully generated:")
print(f"  - {MODEL_PATH}")
print(f"  - {ENCODER_PATH}")