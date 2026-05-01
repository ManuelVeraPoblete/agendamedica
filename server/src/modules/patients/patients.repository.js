import pool from '../../config/database.js';

export class PatientRepository {
  async create({ doctorId, fullName, gender, documentId, phone, email, birthDate, insurance, allergies, conditions, medications, notes }) {
    const [result] = await pool.query(
      `INSERT INTO patients
         (doctor_id, full_name, gender, document_id, phone, email, birth_date, insurance, allergies, conditions, medications, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctorId, fullName, gender, documentId,
        phone     || null,
        email     || null,
        birthDate,
        insurance || null,
        allergies  || null,
        conditions || null,
        medications || null,
        notes      || null,
      ]
    );
    return {
      id: result.insertId,
      doctorId,
      fullName,
      gender,
      documentId,
      phone:       phone       || null,
      email:       email       || null,
      birthDate,
      insurance:   insurance   || null,
      allergies:   allergies   || null,
      conditions:  conditions  || null,
      medications: medications || null,
      notes:       notes       || null,
      createdAt: new Date().toISOString(),
    };
  }

  async findByDoctor(doctorId) {
    const [rows] = await pool.query(
      `SELECT
         id,
         doctor_id    AS doctorId,
         full_name    AS fullName,
         gender,
         document_id  AS documentId,
         phone,
         email,
         birth_date   AS birthDate,
         insurance,
         allergies,
         conditions,
         medications,
         notes,
         created_at   AS createdAt
       FROM patients
       WHERE doctor_id = ?
       ORDER BY full_name`,
      [doctorId]
    );
    return rows;
  }
}
