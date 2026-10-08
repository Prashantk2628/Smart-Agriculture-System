-- SmartAgri Database Setup Script for XAMPP MySQL / phpMyAdmin

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS smartagri_db;
USE smartagri_db;

-- 2. Create Users Table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email_or_mobile VARCHAR(255) NOT NULL UNIQUE,
    gender VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Sample User Insert
-- INSERT INTO users (full_name, email_or_mobile, gender, password) 
-- VALUES ('John Doe', 'farmer@example.com', 'male', 'password123');
