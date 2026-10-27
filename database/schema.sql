CREATE DATABASE IF NOT EXISTS pet_clinic;
USE pet_clinic;

CREATE USER IF NOT EXISTS 'petuser'@'%' IDENTIFIED BY 'petpass';
GRANT ALL PRIVILEGES ON pet_clinic.* TO 'petuser'@'%';
FLUSH PRIVILEGES;

-- Remove tables from the earlier version so this file can be run again safely
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS vets;

CREATE TABLE vets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_name VARCHAR(100) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  status ENUM('pending','approved') NOT NULL DEFAULT 'pending',
  appt_time DATETIME NULL,
  approved_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY vet_slot (approved_by, appt_time),
  FOREIGN KEY (approved_by) REFERENCES vets(id)
);

-- Sample vets. Passwords: meera123 and arjun123
INSERT INTO vets (name, password_hash) VALUES
  ('Meera', '$2y$12$aiV50nSkIeV5cADWCdvfG.SEqKYG3qzJUz4cWBdwXLlm0BOD4.LE6'),
  ('Arjun', '$2y$12$CoHF/AKUV/llmBYoH1dB5.y7JZjzhhoDwNf8XnBm2QY4xEOQP2rF.');
