// Simple migration runner: applies migrations/001_init.sql against PGDATABASE.
// Usage: npm run migrate
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const sqlPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
