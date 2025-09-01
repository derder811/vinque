// pages/HomePage/HomePage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Card from "../../Compo/CardItem/CardItem.jsx";
import Header from "../../Compo/Header/Header.jsx";
import Carousel from "../../Compo/Carousel/Carousel.jsx";
import Category from "../../Compo/CategoryNav/CategoryNav.jsx";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const { customerId } = useParams(); // From route: /home/:customerId
  const location = useLocation();
  const navigate = useNavigate();

  const navRef = useRef(null);
  const categoryRef = useRef(null);
  const cardRefs = useRef([]);
  const [items, setItems] = useState([]);
  const [filterItems, setFilterItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.showItem);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (navRef.current) observer.observe(navRef.current);
    if (categoryRef.current) observer.observe(categoryRef.current);
    cardRefs.current.forEach((card) => card && observer.observe(card));

    return () => {
      if (navRef.current) observer.unobserve(navRef.current);
      if (categoryRef.current) observer.unobserve(categoryRef.current);
      cardRefs.current.forEach((card) => card && observer.unobserve(card));
    };
  }, [filterItems]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const searchTerm = queryParams.get("q");

        const url = searchTerm
          ? `http://localhost:4280/api/header/search?q=${encodeURIComponent(searchTerm)}`
          : "http://localhost:4280/api/home-products";

        const res = await fetch(url);
        const json = await res.json();

        if (json.status === "success") {
          const normalizedData = json.data.map((item) => {
            const cleanPath = (path) => {
              if (!path) return null;
              return path.startsWith("/uploads/")
                ? path
                : `/uploads/${path.replace(/^\/+/, "")}`;
            };

            return {
              ...item,
              image1_path: cleanPath(item.image1_path),
            };
          });

          setItems(normalizedData);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setItems([]);
      }
    };

    fetchItems();
  }, [location.search]);

  useEffect(() => {
    if (!selectedCategory) {
      setFilterItems(items);
    } else {
      const filtered = items.filter((item) => item.category === selectedCategory);
      setFilterItems(filtered);
    }
  }, [selectedCategory, items]);

  const handleCardClick = async (productId) => {
    try {
      await fetch(`http://localhost:4280/api/visit/${productId}`, {
        method: "PUT",
      });
    } catch (err) {
      console.error("Failed to increment visit count:", err);
    } finally {
      navigate(`/item-detail/${productId}`);
    }
  };

  const handleSearch = (term) => {
    setSelectedCategory(null);
    navigate(`/home/${customerId}?q=${encodeURIComponent(term)}`);
  };

  // Split items into featured and best sellers
  const featuredItems = filterItems.slice(0, 4);
  const bestSellerItems = filterItems.slice(4, 8);

  return (
    <div className={styles.HomePage}>
      <Header isSeller={false} onSearch={handleSearch} showItems={true} />
      
      {/* Navigation Tabs */}
      <div className={styles.navTabs}>
        <button className={`${styles.navTab} ${styles.active}`}>Home</button>
        <button className={styles.navTab}>Shop</button>
        <button className={styles.navTab}>Collections</button>
        <button className={styles.navTab}>About</button>
      </div>

      {/* Category Filter Tabs */}
      <div ref={categoryRef} className={`${styles.categoryTabs} ${styles.appearItem}`}>
        <button 
          className={`${styles.categoryTab} ${!selectedCategory ? styles.active : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        <button 
          className={`${styles.categoryTab} ${selectedCategory === 'new' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('new')}
        >
          New Arrivals
        </button>
        <button 
          className={`${styles.categoryTab} ${selectedCategory === 'bestseller' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('bestseller')}
        >
          Best Sellers
        </button>
      </div>

      {/* Featured Products Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured Products</h2>
        <div className={styles.productGrid}>
          {featuredItems.length > 0 ? (
            featuredItems.map((item, index) => (
              <div
                key={item.product_id}
                ref={(el) => (cardRefs.current[index] = el)}
                className={styles.appearItem}
              >
                <Card data={item} onCardClick={() => handleCardClick(item.product_id)} />
              </div>
            ))
          ) : (
            <p className={styles.noItems}>No featured items to display</p>
          )}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Best Sellers</h2>
        <div className={styles.productGrid}>
          {bestSellerItems.length > 0 ? (
            bestSellerItems.map((item, index) => (
              <div
                key={item.product_id}
                ref={(el) => (cardRefs.current[index + 4] = el)}
                className={styles.appearItem}
              >
                <Card data={item} onCardClick={() => handleCardClick(item.product_id)} />
              </div>
            ))
          ) : (
            <p className={styles.noItems}>No best seller items to display</p>
          )}
        </div>
      </section>
    </div>
  );
}
