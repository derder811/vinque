import React, { useRef, useState, useEffect } from 'react';
import styles from './CategoryNav.module.css';

export default function CategoryNav({ onCategorySelect, selectedCategory }) {
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/category-nav");
        const result = await res.json();
        if (result.status === "success") {
          setCategories(result.data);
        } else {
          console.error("Category fetch failed:", result.message);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [categories]);

  const scroll = (direction) => {
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCategoryClick = (category) => {
    onCategorySelect(category === selectedCategory ? null : category);
  };

  return (
    <div className={styles.navbarWrapper}>
      <nav className={styles.navbar}>
        <button className={`${styles.arrowButton} ${styles.leftArrow}`} onClick={() => scroll('left')}>
          ◀
        </button>

        <div className={styles.scrollContainer} ref={scrollRef}>
          <ul className={styles.list}>
            {categories.map((category) => (
              <li
                key={category}
                className={`${styles.listItem} ${selectedCategory === category ? styles.selected : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        <button className={`${styles.arrowButton} ${styles.rightArrow}`} onClick={() => scroll('right')}>
          ▶
        </button>
      </nav>
    </div>
  );
}
