/**
 * Ejecuta el schema SQL y luego el seed en secuencia.
 * Uso: node migrations/setup.js
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function applySchema() {
  const conn = await createConnection({
    host:               process.env.DB_HOST     ?? 'localhost',
    port:               Number(process.env.DB_PORT ?? 3306),
    user:               process.env.DB_USER     ?? 'manolo',
    password:           process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  });

  const sql = readFileSync(resolve(__dirname, '001_schema.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();
  console.log('✅ Schema aplicado');
}

applySchema()
  .then(() => import('./seed.js'))
  .catch((err) => {
    console.error('❌ Setup fallido:', err.message);
    process.exit(1);
  });
