// src/Pages/AdminPage/AdminPage.jsx

import { useState, useEffect } from 'react';
import styles from './Admin.module.css';
import Header from '../../Compo/Header/Header';

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loginHistory, setLoginHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');

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

    const fetchPurchaseHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/purchases`);
        const data = await res.json();
        if (data.status === 'success') {
          setPurchaseHistory(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch purchase history:", err);
      }
    };

    const fetchPendingSellers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/pending-sellers`);
        const data = await res.json();
        if (data.status === 'success') {
          setPendingSellers(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch pending sellers:", err);
      }
    };

    fetchLoginHistory();
    fetchPurchaseHistory();
    fetchPendingSellers();
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

  // Handle seller approval/rejection
  const handleApproveSeller = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/approve-seller/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Remove the approved seller from the pending list
        setPendingSellers(prev => prev.filter(seller => seller.user_id !== userId));
        alert('Seller approved successfully!');
      } else {
        alert('Failed to approve seller: ' + data.message);
      }
    } catch (err) {
      console.error('Error approving seller:', err);
      alert('Error approving seller');
    }
  };

  const handleRejectSeller = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reject-seller/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Remove the rejected seller from the pending list
        setPendingSellers(prev => prev.filter(seller => seller.user_id !== userId));
        alert('Seller rejected successfully!');
      } else {
        alert('Failed to reject seller: ' + data.message);
      }
    } catch (err) {
      console.error('Error rejecting seller:', err);
      alert('Error rejecting seller');
    }
  };

  // Calculate statistics
  const totalUsers = loginHistory.length;
  const activeUsers = loginHistory.filter(user => user.logout === '0000-00-00 00:00:00').length;
  const totalPurchases = purchaseHistory.length;
  const customerCount = loginHistory.filter(user => user.role === 'Customer').length;
  const sellerCount = loginHistory.filter(user => user.role === 'Seller').length;

  return (
    <>
      <Header isSeller={false} showSearchBar={false} />
      <div className={styles.adminContainer}>
        {/* Modern Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <i className="bi bi-speedometer2"></i>
            <h3>Admin Panel</h3>
          </div>
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeSection === 'dashboard' ? styles.active : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <i className="bi bi-house-door"></i>
              <span>Dashboard</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'users' ? styles.active : ''}`}
              onClick={() => setActiveSection('users')}
            >
              <i className="bi bi-people"></i>
              <span>User Management</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'purchases' ? styles.active : ''}`}
              onClick={() => setActiveSection('purchases')}
            >
              <i className="bi bi-cart-check"></i>
              <span>Purchase History</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'analytics' ? styles.active : ''}`}
              onClick={() => setActiveSection('analytics')}
            >
              <i className="bi bi-graph-up"></i>
              <span>Analytics</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'pending-sellers' ? styles.active : ''}`}
              onClick={() => setActiveSection('pending-sellers')}
            >
              <i className="bi bi-person-plus"></i>
              <span>Pending Seller Accounts</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Dashboard Overview</h1>
                <p>Welcome to your admin dashboard</p>
              </div>
              
              {/* Statistics Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bi bi-person-check-fill"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{activeUsers}</h3>
                    <p>Active Users</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bi bi-cart-fill"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{totalPurchases}</h3>
                    <p>Total Purchases</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bi bi-shop"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{sellerCount}</h3>
                    <p>Sellers</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.quickActions}>
                <h2>Quick Actions</h2>
                <div className={styles.actionGrid}>
                  <button className={styles.actionCard} onClick={() => setActiveSection('users')}>
                    <i className="bi bi-person-lines-fill"></i>
                    <span>Manage Users</span>
                  </button>
                  <button className={styles.actionCard} onClick={() => setActiveSection('purchases')}>
                    <i className="bi bi-cart-check"></i>
                    <span>View Purchases</span>
                  </button>
                  <button className={styles.actionCard} onClick={() => setActiveSection('analytics')}>
                    <i className="bi bi-graph-up"></i>
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* User Management Section */}
          {activeSection === 'users' && (
            <>
              <div className={styles.pageHeader}>
                <h1>User Management</h1>
                <p>Manage user accounts and login history</p>
              </div>
              
              <div className={styles.searchBar}>
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <i className="bi bi-person-lines-fill"></i>
                  Login/Logout History
                </h2>
                <div className={styles.tableContainer}>
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
                          <div>
                            <span className={`${styles.roleBadge} ${styles[user.role?.toLowerCase()]}`}>
                              {user.role}
                            </span>
                          </div>
                          <div>{user.login}</div>
                          <div>
                            {user.logout === '0000-00-00 00:00:00' ? 
                              <span className={styles.onlineBadge}>Online</span> : 
                              user.logout
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Purchase History Section */}
          {activeSection === 'purchases' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Purchase History</h1>
                <p>Track all purchase transactions</p>
              </div>
              
              <div className={styles.searchBar}>
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <i className="bi bi-cart-check"></i>
                  Purchase Transactions
                </h2>
                <div className={styles.tableContainer}>
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
            </>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Analytics</h1>
                <p>System performance and user insights</p>
              </div>
              
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <h3>User Distribution</h3>
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.userStats}>
                      <div className={styles.userStat}>
                        <span className={styles.statLabel}>Customers</span>
                        <span className={styles.statValue}>{customerCount}</span>
                      </div>
                      <div className={styles.userStat}>
                        <span className={styles.statLabel}>Sellers</span>
                        <span className={styles.statValue}>{sellerCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.analyticsCard}>
                  <h3>System Activity</h3>
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.activityStats}>
                      <p>Total Logins: {totalUsers}</p>
                      <p>Active Sessions: {activeUsers}</p>
                      <p>Purchase Activity: {totalPurchases}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pending Seller Accounts Section */}
          {activeSection === 'pending-sellers' && (
            <>
              <div className={styles.pageHeader}>
                <h1>Pending Seller Accounts</h1>
                <p>Review and approve seller account applications</p>
              </div>
              
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <i className="bi bi-person-plus"></i>
                  Seller Applications
                </h2>
                <div className={styles.tableContainer}>
                  <div className={styles.table}>
                    <div className={styles.tableHeader}>
                      <div>Application ID</div>
                      <div>Business Name</div>
                      <div>Owner Name</div>
                      <div>Email</div>
                      <div>Phone</div>
                      <div>Business Number</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className={styles.scrollableTable}>
                      {pendingSellers.length === 0 ? (
                        <div className={styles.tableRow}>
                          <div colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                            No pending seller applications
                          </div>
                        </div>
                      ) : (
                        pendingSellers.map((seller) => (
                          <div key={seller.user_id} className={styles.tableRow}>
                            <div>{seller.user_id}</div>
                            <div>{seller.business_name}</div>
                            <div>{seller.First_name} {seller.Last_name}</div>
                            <div>{seller.email}</div>
                            <div>{seller.phone_num}</div>
                            <div>{seller.business_number || 'N/A'}</div>
                            <div>
                              <span className={`${styles.roleBadge} ${styles.pending}`}>
                                {seller.approval_status}
                              </span>
                            </div>
                            <div>
                              <button 
                                className={styles.approveBtn}
                                onClick={() => handleApproveSeller(seller.user_id)}
                              >
                                Approve
                              </button>
                              <button 
                                className={styles.rejectBtn}
                                onClick={() => handleRejectSeller(seller.user_id)}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
