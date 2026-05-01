import pool from '../../config/database.js';

export class AuthRepository {
  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.password_hash,
         u.role,
         u.email,
         u.is_active,
         COALESCE(d.id, s.id, a.id)           AS profile_id,
         COALESCE(d.name, s.name, a.name)     AS name,
         d.specialty,
         d.avatar_color
       FROM users u
       LEFT JOIN doctors     d ON d.user_id = u.id
       LEFT JOIN secretaries s ON s.user_id = u.id
       LEFT JOIN admins      a ON a.user_id = u.id
       WHERE u.username = ? OR u.email = ?
       LIMIT 1`,
      [username, username]
    );
    return rows[0] ?? null;
  }

  async findDoctorIdsBySecretaryId(secretaryId) {
    const [rows] = await pool.query(
      `SELECT doctor_id FROM secretary_doctor_access WHERE secretary_id = ?`,
      [secretaryId]
    );
    return rows.map((r) => r.doctor_id);
  }
}
