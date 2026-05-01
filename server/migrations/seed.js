import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

async function seed() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const hash = await bcrypt.hash('demo1234', 10);

    // ── users ────────────────────────────────────────────────
    const insertUser = (username, role, email) =>
      conn.query(
        'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
        [username, hash, role, email]
      );

    const [r1] = await insertUser('carla.mendez',     'doctor',    'carla@medic.app');
    const [r2] = await insertUser('andres.rojas',     'doctor',    'andres@medic.app');
    const [r3] = await insertUser('maria.gonzalez',   'secretary', 'maria@medic.app');
    const [r4] = await insertUser('valentina.torres', 'secretary', 'valentina@medic.app');
    const [r5] = await insertUser('camila.reyes',     'secretary', 'camila@medic.app');
    const [r6] = await insertUser('admin',            'admin',     'admin@medic.app');

    // ── doctors ──────────────────────────────────────────────
    const [d1] = await conn.query(
      'INSERT INTO doctors (user_id, name, specialty, avatar_color) VALUES (?, ?, ?, ?)',
      [r1.insertId, 'Dra. Carla Méndez', 'Cardiología', 'oklch(0.72 0.11 230)']
    );
    const [d2] = await conn.query(
      'INSERT INTO doctors (user_id, name, specialty, avatar_color) VALUES (?, ?, ?, ?)',
      [r2.insertId, 'Dr. Andrés Rojas', 'Pediatría', 'oklch(0.7 0.15 155)']
    );

    // ── secretaries ──────────────────────────────────────────
    const [s1] = await conn.query('INSERT INTO secretaries (user_id, name) VALUES (?, ?)', [r3.insertId, 'María González']);
    const [s2] = await conn.query('INSERT INTO secretaries (user_id, name) VALUES (?, ?)', [r4.insertId, 'Valentina Torres']);
    const [s3] = await conn.query('INSERT INTO secretaries (user_id, name) VALUES (?, ?)', [r5.insertId, 'Camila Reyes']);

    // ── admins ───────────────────────────────────────────────
    await conn.query('INSERT INTO admins (user_id, name) VALUES (?, ?)', [r6.insertId, 'Administrador']);

    // ── secretary_doctor_access ──────────────────────────────
    await conn.query(
      'INSERT INTO secretary_doctor_access (secretary_id, doctor_id) VALUES (?,?),(?,?),(?,?),(?,?)',
      [
        s1.insertId, d1.insertId,  // María → Dra. Carla
        s1.insertId, d2.insertId,  // María → Dr. Andrés
        s2.insertId, d1.insertId,  // Valentina → Dra. Carla
        s3.insertId, d2.insertId,  // Camila → Dr. Andrés
      ]
    );

    // ── locations ────────────────────────────────────────────
    const [l1] = await conn.query(
      'INSERT INTO locations (doctor_id, name, address, type, color) VALUES (?,?,?,?,?)',
      [d1.insertId, 'Clínica Las Condes', 'Av. Las Condes 12345, Santiago', 'clinica', 'oklch(0.72 0.11 230)']
    );
    const [l2] = await conn.query(
      'INSERT INTO locations (doctor_id, name, address, type, color) VALUES (?,?,?,?,?)',
      [d1.insertId, 'Consulta Providencia', 'Av. Providencia 2100, of. 504', 'particular', 'oklch(0.7 0.15 155)']
    );
    const [l3] = await conn.query(
      'INSERT INTO locations (doctor_id, name, address, type, color) VALUES (?,?,?,?,?)',
      [d2.insertId, 'Centro Médico Apoquindo', 'Apoquindo 4500, Las Condes', 'centro', 'oklch(0.78 0.15 75)']
    );
    // loc-4: sin citas hoy, solo insertar
    await conn.query(
      'INSERT INTO locations (doctor_id, name, address, type, color) VALUES (?,?,?,?,?)',
      [d2.insertId, 'Consulta Particular Ñuñoa', 'Av. Irarrázaval 3820, Ñuñoa', 'particular', 'oklch(0.65 0.18 300)']
    );

    // ── patients ─────────────────────────────────────────────
    const addPatient = (docId, fullName, gender, documentId, phone, email, birthDate, insurance, extra = {}) =>
      conn.query(
        `INSERT INTO patients
           (doctor_id, full_name, gender, document_id, phone, email, birth_date, insurance, allergies, conditions, medications)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          docId, fullName, gender, documentId, phone, email, birthDate, insurance,
          extra.allergies   ?? null,
          extra.conditions  ?? null,
          extra.medications ?? null,
        ]
      );

    // Pacientes de Dra. Carla
    const [p1] = await addPatient(d1.insertId, 'Juan Pérez Soto',      'masculino', '12.345.678-9', '+56 9 8765 4321', 'juan.perez@mail.com',    '1985-04-12', 'Isapre Banmédica', { conditions: 'Hipertensión controlada', medications: 'Losartán 50mg' });
    const [p2] = await addPatient(d1.insertId, 'Ana Silva Rojas',      'femenino',  '15.432.987-1', '+56 9 5555 1212', 'ana.silva@mail.com',     '1992-09-03', 'Fonasa');
    const [p4] = await addPatient(d1.insertId, 'Claudia Vega Moreno',  'femenino',  '17.654.321-K', '+56 9 3344 5566', 'claudia.vega@mail.com',  '1978-11-15', 'Particular',       { allergies: 'Penicilina' });
    const [p5] = await addPatient(d1.insertId, 'Roberto Núñez Parra',  'masculino', '11.223.344-5', '+56 9 6677 8899', 'roberto.nunez@mail.com', '1965-03-22', 'Fonasa',           { conditions: 'Diabetes tipo 2', medications: 'Metformina 850mg' });
    const [p6] = await addPatient(d1.insertId, 'Patricia Leal Fuentes','femenino',  '14.567.890-2', '+56 9 9988 7766', 'patricia.leal@mail.com', '1990-07-08', 'Isapre Consalud');

    // Pacientes de Dr. Andrés
    const [p3] = await addPatient(d2.insertId, 'Tomás Morales (5 años)',    'masculino', '25.111.222-3', '+56 9 7777 8888', 'padre.tomas@mail.com',    '2019-06-21', 'Isapre Colmena');
    const [p7] = await addPatient(d2.insertId, 'Sofía Castillo Ibáñez',    'femenino',  '22.987.654-1', '+56 9 4455 6677', 'sofia.castillo@mail.com', '2021-02-14', 'Fonasa');
    const [p8] = await addPatient(d2.insertId, 'Martín Díaz Soto',         'masculino', '23.456.789-0', '+56 9 8899 0011', 'mama.martin@mail.com',    '2018-08-30', 'Isapre Banmédica', { allergies: 'Ibuprofeno' });
    const [p9] = await addPatient(d2.insertId, 'Valentina Herrera Lagos',  'femenino',  '24.321.987-K', '+56 9 1122 3344', 'valentina.h@mail.com',    '2016-11-05', 'Particular',       { conditions: 'Asma leve', medications: 'Salbutamol en crisis' });

    // ── appointments ─────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);

    const appointments = [
      // Dra. Carla
      [d1.insertId, p1.insertId, l1.insertId, today, '09:30', 30, 'Control de presión arterial',       'atendida',  'secretary', 35000],
      [d1.insertId, p2.insertId, l1.insertId, today, '10:30', 30, 'Dolor torácico ocasional',           'atendida',  'doctor',    9500],
      [d1.insertId, p4.insertId, l1.insertId, today, '11:30', 45, 'Consulta general',                   'atendida',  'secretary', 55000],
      [d1.insertId, p5.insertId, l1.insertId, today, '12:00', 30, 'Hipertensión – control mensual',     'atendida',  'secretary', 9500],
      [d1.insertId, p6.insertId, l1.insertId, today, '15:00', 30, 'Arritmia – seguimiento',             'atendida',  'secretary', 32000],
      [d1.insertId, p1.insertId, l2.insertId, today, '16:00', 45, 'Ecocardiograma de seguimiento',      'pendiente', 'secretary', 40000],
      [d1.insertId, p2.insertId, l1.insertId, today, '17:00', 30, 'Examen de resultados',               'confirmada','doctor',    9500],
      // Dr. Andrés
      [d2.insertId, p7.insertId, l3.insertId, today, '09:00', 30, 'Control de desarrollo',                       'atendida',  'secretary', 22000],
      [d2.insertId, p8.insertId, l3.insertId, today, '10:00', 30, 'Fiebre y tos persistente',                    'atendida',  'secretary', 28000],
      [d2.insertId, p3.insertId, l3.insertId, today, '11:00', 30, 'Control niño sano',                           'atendida',  'secretary', 28000],
      [d2.insertId, p9.insertId, l3.insertId, today, '14:00', 45, 'Control de asma – evaluación semestral',      'confirmada','secretary', 35000],
      [d2.insertId, p3.insertId, l3.insertId, today, '15:30', 30, 'Vacunación según calendario',                 'pendiente', 'secretary', 18000],
    ];

    for (const row of appointments) {
      await conn.query(
        `INSERT INTO appointments
           (doctor_id, patient_id, location_id, date, time, duration_min, reason, status, created_by_role, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        row
      );
    }

    // ── waiting_list ─────────────────────────────────────────
    const waitingList = [
      [d1.insertId, p2.insertId, null,        'Evaluación de resultados de exámenes',        'Paciente ha llamado varias veces, prefiere horario de mañana', 'urgente',  'secretary'],
      [d1.insertId, p4.insertId, l1.insertId, 'Primera consulta cardiológica',               null,                                                           'normal',   'secretary'],
      [d1.insertId, p5.insertId, null,        'Control semestral de rutina',                 'Cualquier día de la semana está bien',                         'flexible', 'secretary'],
      [d2.insertId, p8.insertId, l3.insertId, 'Control post-hospitalización – bronconeumonía','Prioridad alta, tuvo complicaciones',                         'urgente',  'secretary'],
    ];

    for (const row of waitingList) {
      await conn.query(
        `INSERT INTO waiting_list
           (doctor_id, patient_id, location_id, reason, notes, priority, created_by_role)
         VALUES (?,?,?,?,?,?,?)`,
        row
      );
    }

    await conn.commit();

    console.log('✅ Seed completado exitosamente\n');
    console.log('Credenciales demo (contraseña: demo1234):');
    console.log('  carla.mendez       → doctor');
    console.log('  andres.rojas       → doctor');
    console.log('  maria.gonzalez     → secretary (ambos médicos)');
    console.log('  valentina.torres   → secretary (solo Dra. Carla)');
    console.log('  camila.reyes       → secretary (solo Dr. Andrés)');
    console.log('  admin              → admin');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en seed:', err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
