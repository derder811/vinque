import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'e-web'
};

async function debugProfile() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check if there are any customers with profile pictures
    const [customers] = await connection.query(
      "SELECT customer_id, First_name, Last_name, profile_pic FROM customer_tb WHERE profile_pic IS NOT NULL LIMIT 5"
    );
    
    console.log('Customers with profile pictures:');
    console.log(customers);
    
    // Test the header search endpoint logic
    if (customers.length > 0) {
      const testCustomerId = customers[0].customer_id;
      console.log(`\nTesting profile pic fetch for customer_id: ${testCustomerId}`);
      
      const [profileRows] = await connection.query(
        "SELECT profile_pic FROM customer_tb WHERE customer_id = ?",
        [testCustomerId]
      );
      
      const profile = profileRows[0];
      if (profile?.profile_pic) {
        const profilePic = profile.profile_pic.replace(/^uploads[\\\\/]+/, "");
        console.log('Original profile_pic:', profile.profile_pic);
        console.log('Cleaned profile_pic:', profilePic);
        console.log('Full URL would be: http://localhost:4280/uploads/' + profilePic);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) connection.end();
  }
}

debugProfile();