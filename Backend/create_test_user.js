import bcrypt from 'bcrypt';
import db from './database.js';

async function createTestUser() {
  try {
    const username = 'testuser';
    const password = 'testpass123';
    const role = 'Customer';
    
    // Check if user already exists
    const [existing] = await db.query('SELECT username FROM accounts WHERE username = ?', [username]);
    if (existing.length > 0) {
      console.log('❌ Test user already exists');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert the test user
    const [result] = await db.query(
      'INSERT INTO accounts (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    
    console.log('✅ Test user created successfully!');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('User ID:', result.insertId);
    
    // Verify the password works
    const [users] = await db.query('SELECT password FROM accounts WHERE username = ?', [username]);
    const match = await bcrypt.compare(password, users[0].password);
    
    if (match) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (err) {
    console.error('❌ Error creating test user:', err);
  }
  process.exit();
}

createTestUser();