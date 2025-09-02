import React from 'react';
import { useCart } from '../../Context/CartContext';
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.css';

export default function Cart({ isOpen, onClose }) {
  const { items, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    // For now, just show an alert. You can implement proper checkout later
    alert(`Proceeding to checkout with ${getTotalItems()} items totaling ₱${getTotalPrice().toFixed(2)}`);
    onClose();
  };

  const handleItemClick = (productId) => {
    navigate(`/item-detail/${productId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.cartOverlay} onClick={onClose}>
      <div className={styles.cartContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cartHeader}>
          <h2>Shopping Cart</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.cartContent}>
          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyCartIcon}>🛒</div>
              <p>Your cart is empty</p>
              <p className={styles.emptyCartSubtext}>Add some items to get started!</p>
            </div>
          ) : (
            <>
              <div className={styles.cartItems}>
                {items.map((item) => {
                  const imageSrc = item.image1_path
                    ? (item.image1_path.startsWith('/uploads/') 
                        ? item.image1_path 
                        : `/uploads/${item.image1_path.replace(/^\/+/, '')}`)
                    : '/placeholder.jpg';

                  return (
                    <div key={item.product_id} className={styles.cartItem}>
                      <div className={styles.itemImage} onClick={() => handleItemClick(item.product_id)}>
                        <img src={imageSrc} alt={item.product_name} />
                      </div>
                      
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName} onClick={() => handleItemClick(item.product_id)}>
                          {item.product_name}
                        </h4>
                        <p className={styles.itemPrice}>₱{item.price}</p>
                        
                        <div className={styles.quantityControls}>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className={styles.quantity}>{item.quantity}</span>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.itemActions}>
                        <div className={styles.itemTotal}>
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button 
                          className={styles.removeButton}
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.cartSummary}>
                <div className={styles.summaryRow}>
                  <span>Total Items:</span>
                  <span>{getTotalItems()}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.totalLabel}>Total Price:</span>
                  <span className={styles.totalPrice}>₱{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.cartActions}>
                <button className={styles.clearButton} onClick={clearCart}>
                  Clear Cart
                </button>
                <button className={styles.checkoutButton} onClick={handleCheckout}>
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}