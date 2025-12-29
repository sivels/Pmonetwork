const { Pool } = require('pg');

async function checkData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const tables = ['Message', 'Conversation', 'ActivityLog', 'Application', 'Job'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`${table}: ${result.rows[0].count} records`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
