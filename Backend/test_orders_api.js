import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

// Test the orders API endpoint
async function testOrdersAPI() {
    console.log('Testing Orders API...');
    
    // Test different user IDs that have orders
    const userIdsToTest = [1, 2, 5, 15]; // Based on our database check
    
    for (const userId of userIdsToTest) {
        try {
            console.log(`\n=== Testing User ID: ${userId} ===`);
            const response = await fetch(`http://localhost:4280/api/orders/${userId}`);
            
            if (!response.ok) {
                console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                continue;
            }
            
            const data = await response.json();
            console.log(`✅ Response Status: ${data.status}`);
            
            if (data.status === 'success') {
                console.log(`📦 Orders found: ${data.orders ? data.orders.length : 0}`);
                if (data.orders && data.orders.length > 0) {
                    data.orders.forEach(order => {
                        console.log(`   - Order ${order.order_id}: ${order.product_name} (${order.status})`);
                    });
                }
            } else {
                console.log(`❌ API Error: ${data.message}`);
            }
        } catch (error) {
            console.log(`❌ Request Error: ${error.message}`);
        }
    }
}

testOrdersAPI();