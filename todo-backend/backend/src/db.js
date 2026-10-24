const { Pool } = require('pg');
require('dotenv').config();

const configuredHost = process.env.PGHOST || 'localhost';
const host = configuredHost.split('/')[0];
const sslRequired =
  process.env.PGSSLMODE === 'require' || configuredHost.includes('sslmode=require');

const pool = new Pool({
  host,
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'tododb',
  ...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;
