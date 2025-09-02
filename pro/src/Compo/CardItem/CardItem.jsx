// frontend/src/Compo/CardItem/CardItem.jsx
import React from "react";
import styles from "./CardItem.module.css";

export default function CardItem({
  data,
  onCardClick,
}) {
  const isVerified = data?.verified === 1;

  const imageSrc = (() => {
    if (!data?.image1_path) return "/placeholder.jpg";
    const cleanedPath = data.image1_path.startsWith("/uploads/")
      ? data.image1_path
      : `/uploads/${data.image1_path.replace(/^\/+/, "")}`;
    return cleanedPath;
  })();



  return (
    <div
      className={styles.card}
      onClick={() => onCardClick(data.product_id)}
    >

      
      <div className={styles.imageContainer}>
        <img className={styles.image} src={imageSrc} alt={data.product_name} />
      </div>
      
      <div className={styles.content}>

        
        <h3 className={styles.title}>{data?.product_name || "Unnamed Product"}</h3>
        <p className={styles.description}>
          {data?.description ? data.description.substring(0, 60) + '...' : 'High-quality product with premium materials'}
        </p>
        
        <div className={styles.priceContainer}>
          <span className={styles.currentPrice}>₱{data?.price || 0}</span>
        </div>
        
        <button className={styles.addButton}>
          <span className={styles.addIcon}>🛒</span>
          Add
        </button>
      </div>
    </div>
  );
}
