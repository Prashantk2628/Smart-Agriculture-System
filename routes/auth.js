const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '../data/users.json');

// Ensure data folder and users.json file exist for offline fallback
if (!fs.existsSync(path.dirname(JSON_FILE))) {
    fs.mkdirSync(path.dirname(JSON_FILE), { recursive: true });
}
if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, JSON.stringify([], null, 2));
}

function loadJsonUsers() {
    try {
        const data = fs.readFileSync(JSON_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

function saveJsonUsers(users) {
    fs.writeFileSync(JSON_FILE, JSON.stringify(users, null, 2));
}

let isMysqlConnected = false;

// Connection to MySQL server (supports auto-creation of database & table)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        isMysqlConnected = false;
        console.warn('⚠️ XAMPP MySQL Not Running: Using local JSON file storage (data/users.json) for authentication.');
        return;
    }
    isMysqlConnected = true;
    console.log('✅ Connected to XAMPP MySQL Server');

    // Auto-create database & users table if they don't exist
    const initSql = `
        CREATE DATABASE IF NOT EXISTS smartagri_db;
        USE smartagri_db;
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email_or_mobile VARCHAR(255) NOT NULL UNIQUE,
            gender VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    db.query(initSql, (queryErr) => {
        if (queryErr) {
            console.error('MySQL Setup Error:', queryErr.message);
        } else {
            console.log('✅ XAMPP Database "smartagri_db" and "users" table initialized.');
        }
    });
});

router.post('/signup', (req, res) => {
    const { full_name, identifier, gender, password } = req.body;

    if (isMysqlConnected) {
        db.query('USE smartagri_db; SELECT * FROM users WHERE email_or_mobile = ?', [identifier], (err, results) => {
            if (err) {
                return res.render('index', { error_msg: 'Database Error. Please try again.' });
            }

            const userRows = Array.isArray(results[1]) ? results[1] : (Array.isArray(results) ? results : []);

            if (userRows.length > 0) {
                return res.render('index', { error_msg: 'User already registered!' });
            }

            const sql = 'INSERT INTO users (full_name, email_or_mobile, gender, password) VALUES (?, ?, ?, ?)';
            db.query(sql, [full_name, identifier, gender, password], (insertErr) => {
                if (insertErr) {
                    return res.render('index', { error_msg: 'Error saving user. Please try again.' });
                }
                res.render('index', { success_msg: 'Registration Successful! Please login.' });
            });
        });
    } else {
        // Fallback: Local JSON file storage in data/users.json
        const users = loadJsonUsers();
        const existing = users.find(u => u.email_or_mobile.toLowerCase() === identifier.trim().toLowerCase());
        if (existing) {
            return res.render('index', { error_msg: 'User already registered!' });
        }

        const newUser = {
            id: Date.now(),
            full_name: full_name.trim(),
            email_or_mobile: identifier.trim(),
            gender: gender,
            password: password,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        saveJsonUsers(users);

        res.render('index', { success_msg: 'Registration Successful (Saved to local database)! Please login.' });
    }
});

router.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    if (isMysqlConnected) {
        db.query('USE smartagri_db; SELECT * FROM users WHERE email_or_mobile = ?', [identifier], (err, results) => {
            if (err) {
                return res.redirect(`/dashboard?name=${encodeURIComponent(identifier || 'Farmer')}`);
            }

            const userRows = Array.isArray(results[1]) ? results[1] : (Array.isArray(results) ? results : []);

            if (userRows.length === 0) {
                return res.render('index', { error_msg: 'User not found!' });
            }

            const user = userRows[0];

            if (password === user.password) {
                res.redirect(`/dashboard?name=${encodeURIComponent(user.full_name)}`);
            } else {
                res.render('index', { error_msg: 'Incorrect Password!' });
            }
        });
    } else {
        // Fallback: Local JSON file lookup in data/users.json
        const users = loadJsonUsers();
        const user = users.find(u => u.email_or_mobile.toLowerCase() === identifier.trim().toLowerCase());

        if (!user) {
            // If user not in JSON file either, allow guest demo login or show error
            return res.redirect(`/dashboard?name=${encodeURIComponent(identifier || 'Farmer')}`);
        }

        if (user.password === password) {
            res.redirect(`/dashboard?name=${encodeURIComponent(user.full_name)}`);
        } else {
            res.render('index', { error_msg: 'Incorrect Password!' });
        }
    }
});

router.get('/logout', (req, res) => {
    res.redirect('/');
});

module.exports = router;