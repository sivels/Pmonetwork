const { Pool } = require('pg');

async function clearSeedData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🗑️  Clearing seed data from production database...\n');

    // Delete in order to respect foreign key constraints
    await pool.query('DELETE FROM "Message"');
    console.log('✓ Cleared messages');

    await pool.query('DELETE FROM "Conversation"');
    console.log('✓ Cleared conversations');

    await pool.query('DELETE FROM "ActivityLog"');
    console.log('✓ Cleared activity logs');

    await pool.query('DELETE FROM "ContactSubmission"');
    console.log('✓ Cleared contact submissions');

    await pool.query('DELETE FROM "SavedCandidate"');
    console.log('✓ Cleared saved candidates');

    await pool.query('DELETE FROM "ApplicationStatusHistory"');
    console.log('✓ Cleared application status history');

    await pool.query('DELETE FROM "Application"');
    console.log('✓ Cleared applications');

    await pool.query('DELETE FROM "Job"');
    console.log('✓ Cleared jobs');

    await pool.query('DELETE FROM "Education"');
    console.log('✓ Cleared education');

    await pool.query('DELETE FROM "Experience"');
    console.log('✓ Cleared experience');

    await pool.query('DELETE FROM "Certification"');
    console.log('✓ Cleared certifications');

    await pool.query('DELETE FROM "Skill"');
    console.log('✓ Cleared skills');

    await pool.query('DELETE FROM "Document"');
    console.log('✓ Cleared documents');

    await pool.query('DELETE FROM "SharedDocument"');
    console.log('✓ Cleared shared documents');

    await pool.query('DELETE FROM "EmployerProfile"');
    console.log('✓ Cleared employer profiles');

    await pool.query('DELETE FROM "CandidateProfile"');
    console.log('✓ Cleared candidate profiles');

    // Clear auth-related tables but keep your account
    await pool.query('DELETE FROM "Account" WHERE "userId" NOT IN (SELECT id FROM "User" WHERE email = $1)', ['levibatty@gmail.com']);
    console.log('✓ Cleared other accounts');

    await pool.query('DELETE FROM "PasswordResetToken"');
    console.log('✓ Cleared password reset tokens');

    await pool.query('DELETE FROM "VerificationToken"');
    console.log('✓ Cleared verification tokens');

    // Keep your verified user, delete others
    const result = await pool.query(
      'DELETE FROM "User" WHERE email != $1 RETURNING email',
      ['levibatty@gmail.com']
    );
    console.log(`✓ Cleared ${result.rowCount} other user(s)`);

    console.log('\n✅ All seed data cleared successfully!');
    console.log('Your account (levibatty@gmail.com) has been preserved.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

clearSeedData();
