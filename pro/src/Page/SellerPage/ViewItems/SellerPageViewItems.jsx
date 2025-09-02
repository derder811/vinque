import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import Sidebar from "../../../Compo/Sidebar/Sidebar";
import CardItem from "../../../Compo/CardItem/CardItem";
import styles from "./SellerPageViewItems.module.css";

export default function SellerPageViewItems() {
  // Debug: Component mounting
  console.log("=== SELLER PAGE VIEW ITEMS COMPONENT MOUNTING ===");
  
  const { id: sellerId } = useParams();
  console.log("Seller ID from URL params:", sellerId);
  
  const navigate = useNavigate();
  const location = useLocation();
  console.log("Current location pathname:", location.pathname);
  console.log("Full location object:", location);
  
  const [items, setItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  
  // Debug: State initialization
  console.log("Component state initialized successfully");

  // Fetch items from backend
  useEffect(() => {
    console.log("useEffect is running with sellerId:", sellerId);
    
    const fetchItems = async () => {
      console.log("=== DEBUG: fetchItems function called with sellerId:", sellerId);
      if (!sellerId) {
        console.error("Seller ID not found in URL. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        // Fetch active items
        const response = await fetch(`/api/card-item/${sellerId}`);
        const result = await response.json();
        if (result.status === "success") {
          console.log("Setting items:", result.data.length, "items");
          console.log("API returned", result.data.length, "items:", result.data);
          setItems(result.data);
        } else {
          console.error("Failed to fetch items:", result.message);
          setItems([]);
        }

        // Fetch archived items
        const archivedResponse = await fetch(`/api/seller/${sellerId}/archived-products`);
        const archivedResult = await archivedResponse.json();
        if (archivedResult.status === "success") {
          setArchivedItems(archivedResult.data);
          console.log("Archived items fetched successfully:", archivedResult.data);
        } else {
          console.error("Failed to fetch archived items:", archivedResult.message);
          setArchivedItems([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setItems([]);
        setArchivedItems([]);
      }
    };

    fetchItems();
  }, [sellerId, refreshTrigger, navigate]);

  // Refresh items after adding a new item
  useEffect(() => {
    if (location.state?.itemAdded) {
      setRefreshTrigger((prev) => prev + 1);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.itemAdded, location.pathname, navigate]);

  const handleAdd = () => {
    navigate(`/seller/add-item/${sellerId}`);
  };

  const handleCardClick = (productId) => {
    navigate(`/seller/edit-item/${productId}`);
  };

  // Archive product function
  const handleArchiveProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellerId: sellerId })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setRefreshTrigger(prev => prev + 1);
        console.log('Product archived successfully');
      } else {
        console.error('Failed to archive product:', result.message);
      }
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  // Restore product function
  const handleRestoreProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellerId: sellerId })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setRefreshTrigger(prev => prev + 1);
        console.log('Product restored successfully');
      } else {
        console.error('Failed to restore product:', result.message);
      }
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  const currentItems = showArchived ? archivedItems : items;
  const filteredItems = currentItems.filter((item) =>
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log("Render - items:", items.length, "currentItems:", currentItems.length, "filteredItems:", filteredItems.length, "showArchived:", showArchived);

  return (
    <>
      <Header showSearchBar={false} showItems={false} isSeller={true} />
      <div className={styles.container}>
        <Sidebar sellerId={sellerId} />
        <main className={styles.content}>
          <div className={styles.topBar}>
            <input
              type="text"
              className={styles.searchBar}
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.toggleButton} ${showArchived ? styles.active : ''}`}
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'View Active' : 'View Archived'}
              </button>
              <button className={styles.addButton} onClick={handleAdd}>
                + Add Item
              </button>
            </div>
          </div>

          <div className={styles.cardGrid}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.product_id} className={styles.cardWrapper}>
                  <CardItem
                    data={item}
                    onCardClick={() => handleCardClick(item.product_id)}
                    showViewCount={true}
                  />
                  <div className={styles.cardActions}>
                    {showArchived ? (
                      <button 
                        className={styles.restoreButton}
                        onClick={() => handleRestoreProduct(item.product_id)}
                      >
                        Restore
                      </button>
                    ) : (
                      <button 
                        className={styles.archiveButton}
                        onClick={() => handleArchiveProduct(item.product_id)}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noItemsMessage}>
                {showArchived 
                  ? 'No archived items found.' 
                  : 'No active items found. Add a new item to get started!'}
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
