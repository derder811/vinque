import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";
import CardItem from "../../Compo/CardItem/CardItem";
import Footer from "../../Compo/Footer/Footer";

export default function LandingPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const cardRefs = useRef([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true); // Set loading to true before fetching
        const res = await fetch("/api/card-item-all");
        const result = await res.json();
        if (result.status === "success") {
          setItems(result.data);
        } else {
          console.error("API returned an error:", result.message);
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
        // Optionally, set an error state here to display to the user
      } finally {
        setLoading(false); // Set loading to false after fetch completes (success or error)
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    // Ensure IntersectionObserver is only created on the client side
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add(styles.showCard);
            } else {
              // Optionally remove the class when not intersecting if you want items to re-animate on scroll back
              entry.target.classList.remove(styles.showCard);
            }
          });
        },
        { threshold: 0.1 }
      );

      // Observe all current card items
      cardRefs.current.forEach((card) => {
        if (card) observer.observe(card);
      });

      // Cleanup function for the observer
      return () => {
        cardRefs.current.forEach((card) => {
          if (card) observer.unobserve(card);
        });
      };
    }
  }, [items]); // Re-run effect when items change

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <main className={styles.landingPage}>
      <div className={styles.backgroundGradient}></div>

      <div className={styles.overlay}>
        {/* <img src="/Vinque_logo.png" alt="Vinque Logo" /> */}
        <h1 className={`${styles.landingTitle} ${styles.fadeInUp}`}>
          Welcome to Vinque
        </h1>
        <p
          className={`${styles.landingSubtitle} ${styles.fadeInUp}`}
          style={{ animationDelay: "0.2s" }}
        >
          Purchase your past
        </p>
        <button
          onClick={handleLoginClick}
          className={`${styles.loginBtn} ${styles.fadeInUp}`}
          style={{ animationDelay: "0.4s" }}
        >
          Get Started
        </button>
      </div>

      <section className={styles.cardSection}>
        {loading ? ( // Display loading text based on loading state
          <p className={styles.loadingText}>Loading items...</p>
        ) : items.length === 0 ? ( // If not loading and no items
          <p className={styles.loadingText}>No items found.</p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx} // Use a unique ID from the item if available, otherwise index
              className={styles.cardItem}
              ref={(el) => (cardRefs.current[idx] = el)}
            >
              <CardItem data={item} />
            </div>
          ))
        )}
      </section>
      
      <Footer />
    </main>
  );
}