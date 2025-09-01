import db from './database.js';

async function checkUsers() {
  try {
    // Get specific user details for jerry
    const [users] = await db.query('SELECT user_id, username, email, password FROM accounts WHERE username = ?', ['jerry']);
    console.log('\nJerry user details:');
    console.table(users);
    
    if (users.length > 0) {
      console.log('\nPassword hash for jerry:', users[0].password);
    }
  } catch (err) {
    console.error('❌ Database error:', err);
  }
  process.exit();
}

checkUsers();