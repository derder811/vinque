// src/Pages/AdminPage/AdminPage.jsx

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';
import Header from '../../Compo/Header/Header';

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4280";

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loginHistory, setLoginHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/A_History`);
        const data = await res.json();
        if (data.status === 'success') {
          setLoginHistory(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch login history:", err);
      }
    };

    fetchLoginHistory();
  }, []);

  const filteredLogin = loginHistory.filter(entry =>
    Object.values(entry).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredPurchases = purchaseHistory.filter(entry =>
    Object.values(entry).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <Header isSeller={false} showSearchBar={false} />
      <div className={styles.adminContainer}>
        <div className={styles.content}>
          <div className={styles.searchBar}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search login or purchase history..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
<div className={styles.section}>
  <h2 className={styles.sectionTitle}>
    <i className="bi bi-person-lines-fill me-2"></i>Login/Logout History
  </h2>
  <div className={styles.table}>
    <div className={styles.tableHeader}>
      <div>User ID</div>
      <div>First Name</div>
      <div>Last Name</div>
      <div>Role</div>
      <div>Login</div>
      <div>Logout</div>
    </div>
    <div className={styles.scrollableTable}>
      {filteredLogin.map((user, index) => (
        <div key={index} className={styles.tableRow}>
          <div>{user.user_id}</div>
          <div>{user.firstName}</div>
          <div>{user.lastName}</div>
          <div>{user.role}</div>
          <div>{user.login}</div>
          <div>{user.logout}</div>
        </div>
      ))}
    </div>
  </div>
</div>

<div className={styles.section}>
  <h2 className={styles.sectionTitle}>
    <i className="bi bi-cart-check me-2"></i>Purchase History
  </h2>
  <div className={styles.table}>
    <div className={styles.tableHeader}>
      <div>Product ID</div>
      <div>Item Name</div>
      <div>Buyer</div>
      <div>Purchase Date</div>
      <div>Business Name</div>
      <div>Business Address</div>
    </div>
    <div className={styles.scrollableTable}>
      {filteredPurchases.map((item, index) => (
        <div key={index} className={styles.tableRow}>
          <div>{item.productId}</div>
          <div>{item.itemName}</div>
          <div>{item.buyer}</div>
          <div>{item.date}</div>
          <div>{item.businessName}</div>
          <div>{item.businessAddress}</div>
        </div>
      ))}
    </div>
  </div>
</div>

        </div>
      </div>
    </>
  );
}
