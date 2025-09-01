import bcrypt from 'bcrypt';
import db from './database.js';

async function testAdminPassword() {
  try {
    const [users] = await db.query('SELECT password FROM accounts WHERE username = ?', ['D_Admin']);
    
    if (users.length === 0) {
      console.log('D_Admin user not found');
      return;
    }
    
    const adminHash = users[0].password;
    console.log('Testing passwords for D_Admin...');
    
    const passwords = ['admin', 'admin123', 'password', 'Password123', 'D_Admin', 'dadmin', '123456', 'test123'];
    
    for (const password of passwords) {
      const match = await bcrypt.compare(password, adminHash);
      if (match) {
        console.log(`✅ FOUND! D_Admin password is: ${password}`);
        return;
      } else {
        console.log(`❌ ${password} - no match`);
      }
    }
    
    console.log('❌ None of the common passwords worked for D_Admin');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
  process.exit();
}

testAdminPassword();