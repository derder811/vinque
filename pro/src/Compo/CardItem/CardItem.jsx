// frontend/src/Compo/CardItem/CardItem.jsx
import React from "react";
import styles from "./CardItem.module.css";

export default function CardItem({
  data,
  onCardClick,
}) {
  const isVerified = data?.verified === 1;
  const isSale = Math.random() > 0.7; // Random sale badge for demo
  const isNew = Math.random() > 0.8; // Random new badge for demo
  const rating = Math.floor(Math.random() * 2) + 4; // Random rating 4-5
  const reviewCount = Math.floor(Math.random() * 200) + 20; // Random review count
  const originalPrice = data?.price ? Math.floor(data.price * 1.2) : 0;

  const imageSrc = (() => {
    if (!data?.image1_path) return "/placeholder.jpg";
    const cleanedPath = data.image1_path.startsWith("/uploads/")
      ? data.image1_path
      : `/uploads/${data.image1_path.replace(/^\/+/, "")}`;
    return `http://localhost:4280${cleanedPath}`;
  })();

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`${styles.star} ${index < rating ? styles.filled : ''}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div
      className={styles.card}
      onClick={() => onCardClick(data.product_id)}
    >
      {/* Badges */}
      {isNew && <span className={`${styles.badge} ${styles.newBadge}`}>NEW</span>}
      {isSale && <span className={`${styles.badge} ${styles.saleBadge}`}>SALE</span>}
      
      <div className={styles.imageContainer}>
        <img className={styles.image} src={imageSrc} alt={data.product_name} />
      </div>
      
      <div className={styles.content}>
        {/* Star Rating */}
        <div className={styles.rating}>
          <div className={styles.stars}>
            {renderStars(rating)}
          </div>
          <span className={styles.reviewCount}>({reviewCount})</span>
        </div>
        
        <h3 className={styles.title}>{data?.product_name || "Unnamed Product"}</h3>
        <p className={styles.description}>
          {data?.description ? data.description.substring(0, 60) + '...' : 'High-quality product with premium materials'}
        </p>
        
        <div className={styles.priceContainer}>
          <span className={styles.currentPrice}>₱{data?.price || 0}</span>
          {isSale && <span className={styles.originalPrice}>₱{originalPrice}</span>}
        </div>
        
        <button className={styles.addButton}>
          <span className={styles.addIcon}>🛒</span>
          Add
        </button>
      </div>
    </div>
  );
}
