import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import Sidebar from "../../../Compo/Sidebar/Sidebar";
import CardItem from "../../../Compo/CardItem/CardItem";
import styles from "./SellerPageViewItems.module.css";

export default function SellerPageViewItems() {
  const { id: sellerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      if (!sellerId) {
        console.error("Seller ID not found in URL. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`http://localhost:4280/api/card-item/${sellerId}`);
        const result = await response.json();
        if (result.status === "success") {
          setItems(result.data);
          console.log("Items fetched successfully:", result.data);
        } else {
          console.error("Failed to fetch items:", result.message);
          setItems([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setItems([]);
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

  const filteredItems = items.filter((item) =>
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <button className={styles.addButton} onClick={handleAdd}>
              + Add Item
            </button>
          </div>

          <div className={styles.cardGrid}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <CardItem
                  key={item.product_id}
                  data={item}
                  onCardClick={() => handleCardClick(item.product_id)}
                  disableVisitCount={true}
                />
              ))
            ) : (
              <p className={styles.noItemsMessage}>
                No items found. Add a new item to get started!
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
