import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import styles from "./ItemsPage.module.css";

export default function ItemsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("All"); // Track active tab
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const statusTabs = ["All", "Pending", "Complete"];

  // Fetch user orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Get user ID from URL params, localStorage customer_id, or user object
        let userId = id;
        if (!userId) {
          userId = localStorage.getItem('customer_id');
        }
        if (!userId) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          userId = user.customer_id;
        }
        if (!userId) {
          userId = '1'; // fallback
        }
        
        const response = await fetch(`/api/orders/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        if (data.status === 'success') {
          setOrders(data.orders);
        } else {
          setError(data.message || 'Failed to load orders');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [id]);

  const handleTabClick = (status) => {
    setActiveTab(status);
  };

  // Filter items based on active tab
  const filteredItems = orders.filter(item => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending") return item.status === "Pending";
    if (activeTab === "Complete") return item.status === "Complete";
    return true;
  });

  const handleViewDetails = (item) => {
    setSelectedOrder(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <>
        <Header isSeller={false} showSearchBar={false} showItems={false} />
        <div className={styles.container}>
          <div className={styles.loading}>Loading your orders...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header isSeller={false} showSearchBar={false} showItems={false} />
        <div className={styles.container}>
          <div className={styles.error}>Error: {error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header isSeller={false} showSearchBar={false} showItems={false} />
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.header}>
            <h1>My Purchases</h1>
            <p>View and manage your purchased items</p>
          </div>

          <div className={styles.tabsContainer}>
            {statusTabs.map((tab) => (
              <button 
                key={tab} 
                className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={styles.itemsGrid}>
            {filteredItems.map((item) => (
              <div key={item.order_id} className={styles.itemCard}>
                <div className={styles.cardImage}>
                  <img 
                    src={item.image_path ? item.image_path : '/src/assets/default-product.jpg'} 
                    alt={item.product_name} 
                    onError={(e) => {
                      e.target.src = '/src/assets/default-product.jpg';
                    }}
                  />
                </div>
                <div className={styles.cardContent}>
                  <h2>{item.product_name}</h2>
                  <div className={styles.price}>₱{item.price}</div>
                  <div className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>
                    Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                  <div className={styles.orderDetails}>
                    <p><strong>Order Date:</strong> {new Date(item.order_date).toLocaleDateString()}</p>
                    <p><strong>Down Payment:</strong> ₱{item.down_payment}</p>
                    <p><strong>Remaining:</strong> ₱{item.remaining_payment}</p>
                    {item.paypal_transaction_id && (
                      <p><strong>Transaction ID:</strong> {item.paypal_transaction_id}</p>
                    )}
                  </div>
                  <button 
                    className={styles.actionButton}
                    onClick={() => handleViewDetails(item)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              <p>No orders found for the selected filter.</p>
            </div>
          )}
        </main>

        {/* Transaction Details Modal */}
        {showModal && selectedOrder && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Transaction Details</h2>
                <button className={styles.closeButton} onClick={closeModal}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.productInfo}>
                  <img 
                    src={selectedOrder.image_path ? selectedOrder.image_path : '/src/assets/default-product.jpg'} 
                    alt={selectedOrder.product_name}
                    className={styles.modalImage}
                  />
                  <div className={styles.productDetails}>
                    <h3>{selectedOrder.product_name}</h3>
                    <p className={styles.modalPrice}>₱{selectedOrder.price}</p>
                  </div>
                </div>
                <div className={styles.transactionInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Order ID:</span>
                    <span className={styles.value}>{selectedOrder.order_id}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Order Date:</span>
                    <span className={styles.value}>{new Date(selectedOrder.order_date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Status:</span>
                    <span className={`${styles.value} ${styles.status} ${styles[selectedOrder.status.toLowerCase()]}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Total Price:</span>
                    <span className={styles.value}>₱{selectedOrder.price}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Down Payment:</span>
                    <span className={styles.value}>₱{selectedOrder.down_payment}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Remaining Payment:</span>
                    <span className={styles.value}>₱{selectedOrder.remaining_payment}</span>
                  </div>
                  {selectedOrder.paypal_transaction_id && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>PayPal Transaction ID:</span>
                      <span className={styles.value}>{selectedOrder.paypal_transaction_id}</span>
                    </div>
                  )}
                  {selectedOrder.payer_name && (
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Payer Name:</span>
                      <span className={styles.value}>{selectedOrder.payer_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}