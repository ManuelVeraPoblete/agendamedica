-- ============================================================
-- MediAgenda — Schema v1
-- ============================================================

CREATE DATABASE IF NOT EXISTS mediagenda
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mediagenda;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)      NOT NULL UNIQUE,
  password_hash VARCHAR(255)     NOT NULL,
  role          ENUM('doctor','secretary','admin') NOT NULL,
  email         VARCHAR(100)     UNIQUE,
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── doctors ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  specialty    VARCHAR(80),
  avatar_color VARCHAR(80),
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── secretaries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secretaries (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_secretaries_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── admins ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admins_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── secretary_doctor_access ──────────────────────────────────
CREATE TABLE IF NOT EXISTS secretary_doctor_access (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  secretary_id INT UNSIGNED NOT NULL,
  doctor_id    INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_secretary_doctor (secretary_id, doctor_id),
  CONSTRAINT fk_sda_secretary
    FOREIGN KEY (secretary_id) REFERENCES secretaries(id) ON DELETE CASCADE,
  CONSTRAINT fk_sda_doctor
    FOREIGN KEY (doctor_id)    REFERENCES doctors(id)     ON DELETE CASCADE
);

-- ── locations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id  INT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  address    VARCHAR(255),
  type       ENUM('clinica','centro','particular') NOT NULL,
  color      VARCHAR(80),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_locations_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ── patients ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id   INT UNSIGNED NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  gender      ENUM('masculino','femenino','otro') NOT NULL,
  document_id VARCHAR(20)  NOT NULL,
  phone       VARCHAR(20),
  email       VARCHAR(100),
  birth_date  DATE,
  insurance   VARCHAR(60),
  allergies   TEXT,
  conditions  TEXT,
  medications TEXT,
  notes       TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ── appointments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id       INT UNSIGNED NOT NULL,
  patient_id      INT UNSIGNED NOT NULL,
  location_id     INT UNSIGNED NOT NULL,
  date            DATE         NOT NULL,
  time            TIME         NOT NULL,
  duration_min    SMALLINT     NOT NULL DEFAULT 30,
  reason          VARCHAR(255),
  status          ENUM('pendiente','confirmada','anulada','atendida') NOT NULL DEFAULT 'pendiente',
  created_by_role ENUM('doctor','secretary') NOT NULL,
  amount          INT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_doctor
    FOREIGN KEY (doctor_id)   REFERENCES doctors(id),
  CONSTRAINT fk_appt_patient
    FOREIGN KEY (patient_id)  REFERENCES patients(id),
  CONSTRAINT fk_appt_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- ── waiting_list ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waiting_list (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id       INT UNSIGNED NOT NULL,
  patient_id      INT UNSIGNED NOT NULL,
  location_id     INT UNSIGNED,
  reason          VARCHAR(255) NOT NULL,
  notes           TEXT,
  priority        ENUM('urgente','normal','flexible') NOT NULL DEFAULT 'normal',
  created_by_role ENUM('doctor','secretary') NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wl_doctor
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
  CONSTRAINT fk_wl_patient
    FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_wl_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
