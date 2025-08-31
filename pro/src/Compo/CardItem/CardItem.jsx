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
    return `http://localhost:4280${cleanedPath}`;
  })();

  return (
    <div
      className={styles.card}
      onClick={() => onCardClick(data.product_id)}
    >
      <img className={styles.image} src={imageSrc} alt={data.product_name} />
      <h2 className={styles.title}>{data?.product_name || "Unnamed Product"}</h2>
      <p className={styles.price}>
        Price: <span className={styles.money}>₱{data?.price || 0}</span>
      </p>
      {isVerified && <p className={styles.status}>Verified</p>}
    </div>
  );
}
