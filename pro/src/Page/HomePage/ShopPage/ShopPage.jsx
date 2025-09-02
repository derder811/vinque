import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import styles from "./ShopPage.module.css";

export default function ShopPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch("/api/seller");
        const result = await response.json();
        
        if (result.status === "success") {
          setSellers(result.data);
        } else {
          setError("Failed to load sellers");
        }
      } catch (err) {
        console.error("Error fetching sellers:", err);
        setError("Unable to fetch sellers");
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const handleSellerClick = (sellerId) => {
    navigate(`/store/${sellerId}`);
  };

  if (loading) {
    return (
      <>
        <Header isSeller={false} showSearchBar={true} showItems={true} />
        <div className={styles.container}>
          <div className={styles.loading}>Loading sellers...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header isSeller={false} showSearchBar={true} showItems={true} />
        <div className={styles.container}>
          <div className={styles.error}>Error: {error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header isSeller={false} showSearchBar={true} showItems={true} />
      <div className={styles.container}>
        {/* Navigation Tabs */}
        <div className={styles.navTabs}>
          <button 
            className={styles.navTab}
            onClick={() => navigate(`/home/${id}`)}
          >
            Home
          </button>
          <button className={`${styles.navTab} ${styles.active}`}>Shop</button>
          <button 
            className={styles.navTab}
            onClick={() => navigate(`/about/${id}`)}
          >
            About
          </button>
        </div>

        <div className={styles.header}>
          <h1>Shop</h1>
          <p>Discover amazing sellers and their unique collections</p>
        </div>

        <div className={styles.sellersGrid}>
          {sellers.map((seller) => (
            <div 
              key={seller.seller_id} 
              className={styles.sellerCard}
              onClick={() => handleSellerClick(seller.seller_id)}
            >
              <div className={styles.sellerImage}>
                {seller.seller_image ? (
                  <img 
                    src={seller.seller_image.startsWith('/uploads/') ? seller.seller_image : `/uploads/${seller.seller_image}`}
                    alt={seller.business_name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="' + styles.placeholderImage + '"><i class="bi bi-shop"></i></div>';
                    }}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <i className="bi bi-shop"></i>
                  </div>
                )}
              </div>
              
              <div className={styles.sellerInfo}>
                <div className={styles.sellerContent}>
                  <h3>{seller.business_name}</h3>
                  <p className={styles.description}>
                    {seller.business_description || "No description available"}
                  </p>
                  <div className={styles.sellerDetails}>
                    <div className={styles.location}>
                      <i className="bi bi-geo-alt"></i>
                      <span>{seller.business_address || "Location not provided"}</span>
                    </div>
                    {seller.phone_num && (
                      <div className={styles.contact}>
                        <i className="bi bi-telephone"></i>
                        <span>{seller.phone_num}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className={styles.visitButton}>
                  Visit Store
                </button>
              </div>
            </div>
          ))}
        </div>

        {sellers.length === 0 && (
          <div className={styles.emptyState}>
            <p>No sellers available at the moment.</p>
          </div>
        )}
      </div>
    </>
  );
}