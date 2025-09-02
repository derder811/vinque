import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3 className={styles.sectionTitle}>About Vinque</h3>
          <p className={styles.sectionText}>
            Vinque is your gateway to discovering antiques, collectibles, and rare finds from passionate sellers.
          </p>
        </div>
        
        <div className={styles.footerSection}>
          <h3 className={styles.sectionTitle}>Quick Links</h3>
          <ul className={styles.linksList}>
            <li><button onClick={() => navigate('/')} className={styles.footerLink}>Home</button></li>
            <li><button onClick={() => navigate('/login')} className={styles.footerLink}>Login</button></li>
            <li><button onClick={() => navigate('/signup')} className={styles.footerLink}>Signup</button></li>
          </ul>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p className={styles.copyright}>© 2025 Vinque. All rights reserved.</p>
      </div>
    </footer>
  );
}