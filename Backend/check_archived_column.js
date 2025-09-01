import mysql from 'mysql2/promise';

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'e-web'
    });

    // Check current table structure
    const [columns] = await connection.execute('DESCRIBE product_tb');
    console.log('Current product_tb columns:');
    columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));

    // Check if archived column exists
    const hasArchived = columns.some(col => col.Field === 'archived');
    
    if (!hasArchived) {
      console.log('\nAdding archived column...');
      await connection.execute('ALTER TABLE product_tb ADD COLUMN archived TINYINT(1) DEFAULT 0');
      console.log('✅ Archived column added successfully!');
    } else {
      console.log('\n✅ Archived column already exists!');
    }

    await connection.end();
  } catch(error) {
    console.error('Error:', error.message);
  }
})();