CREATE DATABASE IF NOT EXISTS pet_clinic;
USE pet_clinic;

CREATE USER IF NOT EXISTS 'petuser'@'%' IDENTIFIED BY 'petpass';
GRANT ALL PRIVILEGES ON pet_clinic.* TO 'petuser'@'%';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  age INT,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vet_id INT NOT NULL,
  appt_time DATETIME NOT NULL,
  reason VARCHAR(255),
  UNIQUE KEY vet_slot (vet_id, appt_time),
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES vets(id)
);

INSERT INTO vets (name, specialty) VALUES
  ('Dr. Meera Shah', 'General care'),
  ('Dr. Arjun Rao', 'Surgery'),
  ('Dr. Nisha Patel', 'Dermatology');