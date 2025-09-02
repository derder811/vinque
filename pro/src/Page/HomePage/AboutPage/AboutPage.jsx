import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import styles from "./AboutPage.module.css";

export default function AboutPage() {
  const navigate = useNavigate();
  const { id } = useParams();

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
          <button 
            className={styles.navTab}
            onClick={() => navigate(`/shop/${id}`)}
          >
            Shop
          </button>
          <button className={`${styles.navTab} ${styles.active}`}>About</button>
        </div>

        <div className={styles.aboutContent}>
          <div className={styles.header}>
            <h1>About Vinque</h1>
            <p>Discover the story behind our marketplace</p>
          </div>

          <div className={styles.contentSection}>
            <div className={styles.missionSection}>
              <h2>Our Mission</h2>
              <p>
                Vinque is dedicated to connecting buyers with unique, high-quality products 
                from talented sellers around the world. We believe in fostering a community 
                where creativity meets commerce, and where every transaction builds lasting relationships.
              </p>
            </div>

            <div className={styles.featuresSection}>
              <h2>What We Offer</h2>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="bi bi-shop"></i>
                  </div>
                  <h3>Curated Marketplace</h3>
                  <p>Discover unique products from verified sellers with a focus on quality and authenticity.</p>
                </div>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h3>Secure Transactions</h3>
                  <p>Shop with confidence using our secure payment system and buyer protection policies.</p>
                </div>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="bi bi-people"></i>
                  </div>
                  <h3>Community Focused</h3>
                  <p>Join a community of passionate buyers and sellers who value quality and craftsmanship.</p>
                </div>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <i className="bi bi-headset"></i>
                  </div>
                  <h3>Customer Support</h3>
                  <p>Get help when you need it with our dedicated customer support team.</p>
                </div>
              </div>
            </div>

            <div className={styles.valuesSection}>
              <h2>Our Values</h2>
              <div className={styles.valuesList}>
                <div className={styles.valueItem}>
                  <strong>Quality First:</strong> We prioritize quality products and exceptional service.
                </div>
                <div className={styles.valueItem}>
                  <strong>Trust & Transparency:</strong> Building trust through honest communication and transparent processes.
                </div>
                <div className={styles.valueItem}>
                  <strong>Innovation:</strong> Continuously improving our platform to serve you better.
                </div>
                <div className={styles.valueItem}>
                  <strong>Community:</strong> Fostering connections between buyers and sellers worldwide.
                </div>
              </div>
            </div>

            <div className={styles.contactSection}>
              <h2>Get In Touch</h2>
              <p>
                Have questions or feedback? We'd love to hear from you. 
                Contact our team and we'll get back to you as soon as possible.
              </p>
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <i className="bi bi-envelope"></i>
                  <span>support@vinque.com</span>
                </div>
                <div className={styles.contactItem}>
                  <i className="bi bi-telephone"></i>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className={styles.contactItem}>
                  <i className="bi bi-geo-alt"></i>
                  <span>123 Marketplace Street, Commerce City, CC 12345</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}