const { Pool } = require('pg');
require('dotenv').config();

const rawHost = process.env.DATABASE_URL || process.env.PGHOST || 'localhost';
const isUri = /^postgres(ql)?:\/\//i.test(rawHost);
const sslRequired =
  process.env.PGSSLMODE === 'require' || rawHost.includes('sslmode=require');

const poolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(sslRequired ? { ssl: { rejectUnauthorized: false } } : {}),
};

if (isUri) {
  poolConfig.connectionString = rawHost;
} else {
  poolConfig.host = rawHost.split('/')[0];
  poolConfig.port = Number(process.env.PGPORT) || 5432;
  poolConfig.user = process.env.PGUSER || 'postgres';
  poolConfig.password = process.env.PGPASSWORD || 'postgres';
  poolConfig.database = process.env.PGDATABASE || 'tododb';
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;
