// frontend/src/Compo/Sidebar/Sidebar.jsx

import React from 'react';
import styles from './Sidebar.module.css'; // Import Sidebar-specific CSS

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sellerId = user?.seller_id;

  return (
    <div className={styles.sidebar}>
      <nav>
        <a href={`/seller/home/${sellerId}`} className={styles.sidebarLink}>
          <i className="bi bi-house-door-fill me-2"></i>Home
        </a>

        <a href={`/seller/view-items/${sellerId}`} className={styles.sidebarLink}>
          <i className="bi bi-list-check me-2"></i>View My Items
        </a>

        <a href={`/seller/orders/${sellerId}`} className={styles.sidebarLink}>
          <i className="bi bi-clipboard-check me-2"></i>Manage Orders
        </a>
        
        {/* You can add more links here */}
      </nav>
    </div>
  );
}
