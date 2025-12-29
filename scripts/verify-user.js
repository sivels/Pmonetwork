const { Pool } = require('pg');

async function verifyUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const result = await pool.query(
      `UPDATE "User" SET "emailVerified" = NOW() WHERE email = $1 RETURNING email, "emailVerified"`,
      ['levibatty@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Account verified successfully!');
      console.log(`Email: ${result.rows[0].email}`);
      console.log(`Verified at: ${result.rows[0].emailVerified}`);
      console.log('\nYou can now log in!');
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyUser();
