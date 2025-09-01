import bcrypt from 'bcrypt';
import db from './database.js';

async function testPasswords() {
  try {
    // Get jerry's hash
    const [users] = await db.query('SELECT password FROM accounts WHERE username = ?', ['jerry']);
    if (users.length === 0) {
      console.log('Jerry user not found');
      return;
    }
    
    const jerryHash = users[0].password;
    console.log('Jerry\'s hash:', jerryHash);
    
    // Test common passwords
    const commonPasswords = [
      'password',
      'password123',
      'test123',
      'jerry123',
      'admin',
      'admin123',
      '123456',
      'qwerty',
      'jerry',
      'Password123'
    ];
    
    console.log('\nTesting common passwords...');
    for (const password of commonPasswords) {
      const match = await bcrypt.compare(password, jerryHash);
      if (match) {
        console.log(`✅ FOUND! Password for jerry is: ${password}`);
        return;
      } else {
        console.log(`❌ ${password} - no match`);
      }
    }
    
    console.log('\n❌ None of the common passwords matched.');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
  process.exit();
}

testPasswords();