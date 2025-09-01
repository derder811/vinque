import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'e-web'
};

async function checkOrders() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database successfully!');
        
        // Check all orders in the database
        console.log('\n=== ALL ORDERS IN DATABASE ===');
        const [orders] = await connection.query('SELECT * FROM orders_tb ORDER BY order_date DESC');
        console.log(`Total orders found: ${orders.length}`);
        
        if (orders.length > 0) {
            orders.forEach(order => {
                console.log(`Order ID: ${order.order_id}, User ID: ${order.user_id}, Product: ${order.product_name}, Status: ${order.status}, Date: ${order.order_date}`);
            });
        } else {
            console.log('No orders found in the database.');
        }
        
        // Check all users in accounts table
        console.log('\n=== ALL USERS IN DATABASE ===');
        const [users] = await connection.query('SELECT user_id, username, email FROM accounts ORDER BY user_id');
        console.log(`Total users found: ${users.length}`);
        
        if (users.length > 0) {
            users.forEach(user => {
                console.log(`User ID: ${user.user_id}, Username: ${user.username}, Email: ${user.email}`);
            });
        }
        
        // Check customer table
        console.log('\n=== ALL CUSTOMERS IN DATABASE ===');
        const [customers] = await connection.query('SELECT customer_id, First_name, Last_name, email FROM customer_tb ORDER BY customer_id');
        console.log(`Total customers found: ${customers.length}`);
        
        if (customers.length > 0) {
            customers.forEach(customer => {
                console.log(`Customer ID: ${customer.customer_id}, Name: ${customer.First_name} ${customer.Last_name}, Email: ${customer.email}`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed.');
        }
    }
}

checkOrders();