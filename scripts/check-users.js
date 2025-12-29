const { Pool } = require('pg');

async function checkUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const users = await pool.query('SELECT id, email, role, "emailVerified", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10');
    
    console.log('\n📊 Recent Users:');
    console.log('================\n');
    
    if (users.rows.length === 0) {
      console.log('No users found in database');
    } else {
      users.rows.forEach((user, i) => {
        console.log(`${i + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    console.log(`Total users: ${users.rows.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
