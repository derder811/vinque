-- Create orders table to store user purchase information
CREATE TABLE IF NOT EXISTS orders_tb (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    down_payment DECIMAL(10, 2) NOT NULL,
    remaining_payment DECIMAL(10, 2) NOT NULL,
    paypal_transaction_id VARCHAR(255),
    payer_name VARCHAR(255),
    status ENUM('Pending', 'Complete') DEFAULT 'Pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product_tb(product_id) ON DELETE CASCADE
);