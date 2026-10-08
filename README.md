# SmartAgri - Smart Agriculture System 🌾🤖

SmartAgri is an AI-powered smart agriculture portal built with Express.js, EJS, Python Machine Learning, PyTorch, and real-time open Mandi market APIs. It provides crop recommendation, plant disease diagnosis, and financial profit analysis for modern precision farming.

---

## 🌟 Key Features

1. **🌱 Crop Profit Analyzer**: Calculates estimated investment, expected yield, and net profit based on land acreage, crop variety, district, and **live daily Mandi market prices** fetched directly from Agmarknet (`data.gov.in`).
2. **🧠 AI Crop Recommendation**: Analyzes soil nutrients ($N, P, K$), temperature, humidity, rainfall, and soil $pH$ using a trained Random Forest model to recommend top suitable crops.
3. **🔬 Plant Doctor (Disease Detection)**: AI-based leaf image diagnostic using PyTorch & MobileNetV3 model trained on plant disease classes.
4. **🔐 Authentication & Dashboard**: Farmer login & sign-up portal integrated with **XAMPP MySQL**.

---

## 🗄️ XAMPP MySQL Setup & Data Storage

All user registration and authentication data is stored in your local XAMPP MySQL database.

### How to Start XAMPP MySQL:
1. Open **XAMPP Control Panel**.
2. Click **Start** next to **MySQL** (and Apache if needed).
3. Start the application (`npm start`). The app automatically connects to MySQL, creates the database `smartagri_db`, and creates the `users` table automatically!

### Where User Data is Stored:
- **Database**: `smartagri_db`
- **Table**: `users`
- **Fields**: `id`, `full_name`, `email_or_mobile`, `gender`, `password`, `created_at`

### How to View Stored Data in phpMyAdmin:
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click on **`smartagri_db`** on the left sidebar.
3. Click on the **`users`** table to view registered users and credentials in real-time.

*(Optional)* You can also manually inspect or run the provided [schema.sql](file:///c:/Users/kumar/OneDrive/Desktop/smart%20agriculture%20system/schema.sql) in phpMyAdmin SQL tab.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v16+)
- Python 3.8+
- XAMPP (for MySQL Database)

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/Prashantk2628/SmartAgri-Smart-Agriculture-System.git
cd SmartAgri-Smart-Agriculture-System
```

Install Node.js dependencies:
```bash
npm install
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Running the System

Start XAMPP MySQL server, then run:
```bash
npm start
```
Open your browser and visit: `http://localhost:3000`

---

## 📁 Repository Structure

```
smart agriculture system/
├── app.js                   # Main Express application entry point
├── schema.sql               # MySQL database schema file for XAMPP
├── package.json             # Node dependencies and scripts
├── requirements.txt         # Python dependencies
├── cleaned_crop_production_investment.csv # Crop investment dataset
├── data/
│   └── merged_crop_dataset.csv             # Crop recommendation dataset
├── routes/
│   └── auth.js              # Authentication routes & XAMPP MySQL setup
├── services/
│   ├── profit_analyzer.py   # Mandi API & Profit analysis engine
│   ├── model.py             # Random Forest Crop Recommendation engine
│   ├── disease_detector.py  # PyTorch Plant Disease detector engine
│   ├── random_forest_pipeline.pkl # Trained Random Forest model
│   ├── label_encoder.pkl    # Label encoder mapping
│   ├── plant_model.pth      # PyTorch MobileNetV3 weights
│   └── classes.txt          # Disease class labels
├── public/                  # Static assets (CSS, JS, Uploads)
└── views/                   # EJS templates (Profit Analyzer, Recommendation, Detection, etc.)
```

---

👥 Team Members

24BCE11168 - Prakhar Gupta

24BCE10669 - Bhini Dua

24BCE11467 - Akhand Pratap Singh

24BCE11110 - Anupriya

24BCE10842 - Tanisha Manshani

24BCE10177 - Kandi Manvith Reddy

24BCE10430 - Shivendra Singh

24BCE11283 - Ayush Pratap Singh

24BCE10618 - Simone Gupta

23BAI11179 - Shresth Singh Kashyap
