const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const { spawn } = require('child_process');
const multer = require('multer');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'public/images/uploads/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration for Leaf Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadDir); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

app.use('/auth', authRoutes);

// --- ROUTE HANDLERS ---
app.get('/', (req, res) => { res.render('index'); });

app.get('/dashboard', (req, res) => {
    const userName = req.query.name || 'User'; 
    res.render('dashboard', { userName: userName });
});

app.get('/about', (req, res) => {
    const userName = req.query.name || 'User';
    res.render('about', { userName: userName });
});

app.get('/recommend', (req, res) => {
    const userName = req.query.name || 'Guest'; 
    res.render('recommendation', { userName: userName }); 
});

// Helper function: Execute Python Profit Analyzer via HTTP (Port 5001) or transparent CLI spawn
async function runPythonProfitAnalyzer(payload) {
    // 1. Try Flask HTTP endpoint first
    try {
        const response = await axios.post('http://127.0.0.1:5001/analyze', payload, { timeout: 1500 });
        if (response.data && !response.data.error) {
            return response.data;
        }
    } catch (err) {
        // Flask server offline or timed out, fallback to CLI spawn below
    }

    // 2. Fallback: Direct Python CLI spawn
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['./services/profit_analyzer.py', JSON.stringify(payload)]);
        let rawData = '';
        let errData = '';

        pythonProcess.stdout.on('data', (data) => { rawData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { errData += data.toString(); });

        pythonProcess.on('close', (code) => {
            try {
                const result = JSON.parse(rawData);
                if (result.error) reject(new Error(result.error));
                else resolve(result);
            } catch (e) {
                reject(new Error(errData || rawData || "Failed to analyze profit"));
            }
        });
    });
}

// Helper function: Execute Python Crop Recommendation via HTTP (Port 5000) or transparent CLI spawn
async function runPythonCropRecommendation(payload) {
    // 1. Try Flask HTTP endpoint first
    try {
        const response = await axios.post('http://127.0.0.1:5000/predict', payload, { timeout: 1500 });
        if (response.data && response.data.recommendations) {
            return response.data;
        }
    } catch (err) {
        // Flask server offline or timed out, fallback to CLI spawn below
    }

    // 2. Fallback: Direct Python CLI spawn
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['./services/model.py', JSON.stringify(payload)]);
        let rawData = '';
        let errData = '';

        pythonProcess.stdout.on('data', (data) => { rawData += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { errData += data.toString(); });

        pythonProcess.on('close', (code) => {
            try {
                const result = JSON.parse(rawData);
                if (result.error) reject(new Error(result.error));
                else resolve(result);
            } catch (e) {
                reject(new Error(errData || rawData || "Failed to get crop recommendations"));
            }
        });
    });
}

// --- PROFIT ANALYZER LOGIC ---
app.get('/profit-analyzer', (req, res) => {
    const allRows = [];
    fs.createReadStream(path.join(__dirname, 'cleaned_crop_production_investment.csv'))
        .pipe(csv())
        .on('data', (data) => allRows.push(data))
        .on('end', () => {
            const uniqueCropsSet = new Set();
            const cropVarietyMap = {};
            allRows.forEach(row => {
                if (row.Crop) {
                    const crop = row.Crop.trim();
                    uniqueCropsSet.add(crop);
                    const variety = row.Variety ? row.Variety.trim() : null;
                    if (variety) {
                        if (!cropVarietyMap[crop]) cropVarietyMap[crop] = new Set();
                        cropVarietyMap[crop].add(variety);
                    }
                }
            });
            const uniqueCrops = Array.from(uniqueCropsSet).sort();
            Object.keys(cropVarietyMap).forEach(k => {
                cropVarietyMap[k] = Array.from(cropVarietyMap[k]).sort();
            });

            res.render('profit_analyzer', {
                uniqueCrops: uniqueCrops,
                cropVarietyMap: cropVarietyMap,
                result: null,
                userName: req.query.name || 'User'
            });
        });
});

app.post('/calculate-profit', async (req, res) => {
    const { cropName, area, district, variety } = req.body;
    const userName = req.body.name || req.query.name || 'User';
    const allRows = []; 

    fs.createReadStream(path.join(__dirname, 'cleaned_crop_production_investment.csv'))
        .pipe(csv())
        .on('data', (row) => { allRows.push(row); })
        .on('end', async () => {
            const uniqueCropsSet = new Set();
            const cropVarietyMap = {};
            allRows.forEach(row => {
                if (row.Crop) {
                    const crop = row.Crop.trim();
                    uniqueCropsSet.add(crop);
                    const v = row.Variety ? row.Variety.trim() : null;
                    if (v) {
                        if (!cropVarietyMap[crop]) cropVarietyMap[crop] = new Set();
                        cropVarietyMap[crop].add(v);
                    }
                }
            });
            const uniqueCrops = Array.from(uniqueCropsSet).sort();
            Object.keys(cropVarietyMap).forEach(k => { cropVarietyMap[k] = Array.from(cropVarietyMap[k]).sort(); });

            if (variety && variety.trim() !== '') {
                const validVarieties = cropVarietyMap[cropName] || [];
                const isValid = validVarieties.some(v => v.toLowerCase() === variety.trim().toLowerCase());
                if (!isValid) {
                    return res.render('profit_analyzer', {
                        uniqueCrops: uniqueCrops, cropVarietyMap: cropVarietyMap, userName: userName,
                        selectedCrop: cropName, selectedArea: area, selectedDistrict: district,
                        selectedVariety: variety, varietyError: `"${variety}" is not a valid variety for ${cropName}.`,
                        result: null
                    });
                }
            }

            try {
                const analysisData = await runPythonProfitAnalyzer({ crop: cropName, acres: area, district: district, variety: variety });

                res.render('profit_analyzer', { 
                    uniqueCrops, cropVarietyMap, userName, selectedCrop: cropName, selectedArea: area, 
                    selectedDistrict: district, selectedVariety: variety, varietyError: null,
                    result: {
                        crop: cropName, variety, area,
                        investment: analysisData.total_investment.toFixed(2),
                        production: analysisData.total_production.toFixed(2),
                        marketValue: analysisData.market_value.toFixed(2),
                        profit: analysisData.net_profit.toFixed(2)
                    }
                });
            } catch (err) { 
                res.render('profit_analyzer', {
                    uniqueCrops, cropVarietyMap, userName, selectedCrop: cropName, selectedArea: area, 
                    selectedDistrict: district, selectedVariety: variety,
                    varietyError: `Unable to calculate profit: ${err.message}`,
                    result: null
                });
            }
        });
});

// --- CROP RECOMMENDATION ROUTE ---
app.post('/api/predict', async (req, res) => {
    try {
        const result = await runPythonCropRecommendation(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Crop recommendation prediction failed", details: err.message });
    }
});

// Alias route for backward compatibility
app.post('/predict', async (req, res) => {
    try {
        const result = await runPythonCropRecommendation(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Crop recommendation prediction failed", details: err.message });
    }
});

// --- DISEASE DETECTION ROUTES ---
app.get('/disease-detection', (req, res) => {
    const userName = req.query.name || 'User';
    res.render('detection', { userName: userName }); 
});

app.post('/predict-disease', upload.single('leafImage'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const imagePath = path.resolve(req.file.path);
    const pythonProcess = spawn('python', ['./services/disease_detector.py', imagePath]);

    let rawData = '';
    pythonProcess.stdout.on('data', (data) => { rawData += data.toString(); });

    pythonProcess.on('close', (code) => {
        try {
            const result = JSON.parse(rawData);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: "Prediction failed", details: rawData });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});