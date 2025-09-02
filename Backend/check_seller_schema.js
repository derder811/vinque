import db from './database.js';

async function checkSellerSchema() {
  try {
    // Check current seller_tb structure
    const [columns] = await db.query('DESCRIBE seller_tb');
    console.log('\nCurrent seller_tb structure:');
    console.table(columns);
    
    // Check if approval_status column exists
    const hasApprovalStatus = columns.some(col => col.Field === 'approval_status');
    
    if (!hasApprovalStatus) {
      console.log('\n❌ approval_status column does not exist. Adding it...');
      
      // Add approval_status column with default value 'pending' for sellers
      await db.query(`
        ALTER TABLE seller_tb 
        ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') 
        DEFAULT 'pending' 
        AFTER phone_num
      `);
      
      console.log('✅ approval_status column added successfully!');
      
      // Update existing sellers to 'approved' status (backward compatibility)
      const [result] = await db.query(`
        UPDATE seller_tb 
        SET approval_status = 'approved' 
        WHERE approval_status = 'pending'
      `);
      
      console.log(`✅ Updated ${result.affectedRows} existing sellers to 'approved' status`);
    } else {
      console.log('✅ approval_status column already exists');
    }
    
    // Show updated structure
    const [newColumns] = await db.query('DESCRIBE seller_tb');
    console.log('\nUpdated seller_tb structure:');
    console.table(newColumns);
    
  } catch (err) {
    console.error('❌ Database error:', err);
  }
  process.exit();
}

checkSellerSchema();