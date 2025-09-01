import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import styles from "./ProfilePage.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const customerId = localStorage.getItem("customer_id");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!customerId) {
          setErrorMsg("User not logged in.");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/profile-info/${customerId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setErrorMsg(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [customerId]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader}></div>
        <span className={styles.loadingText}>Loading profile...</span>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.profileCard}>
          <p style={{ padding: "2rem", color: "#5f4b2c" }}>
            {errorMsg || "No profile data found."}
          </p>
        </div>
      </div>
    );
  }

  const {
    First_name,
    Last_name,
    username,
    phone_num,
    email,
    Address,
    about_info,
    profile_pic,
  } = profile;

  // Handle both Google profile pictures (full URLs) and local uploads
  const displayPic = profile_pic
    ? (profile_pic.startsWith('http') 
        ? profile_pic 
        : (profile_pic.startsWith('/uploads/') ? profile_pic : `/uploads/${profile_pic}`))
    : "/profile_icon.png";
  const formattedAddress = Address ? Address.replace(/,\s*$/, "") : "";
  const displayBio = about_info || "No bio available.";

  return (
    <>
      <Header isSeller={false} showSearchBar={false} />
      <div className={styles.profilePage}>
        <div className={styles.profileCard}>
          <div className={styles.coverPhoto}></div>

          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <img
                src={displayPic}
                alt="Profile"
                className={styles.avatar}
                onError={(e) => (e.target.src = "/profile_icon.png")}
              />
            </div>

            <div className={styles.profileInfo}>
              <h1 className={styles.username}>{First_name} {Last_name}</h1>
              {username && <h2 className={styles.subUsername}>@{username}</h2>}
            </div>
          </div>

          <div className={styles.profileDetails}>
            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>
                <i className="bi bi-person-fill me-2"></i>About
              </h3>
              <p className={styles.bio}>{displayBio}</p>
            </div>

            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>
                <i className="bi bi-telephone-fill me-2"></i>Contact Information
              </h3>
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <i className="bi bi-envelope-fill me-2"></i>{email}
                </div>
                {phone_num && (
                  <div className={styles.contactItem}>
                    <i className="bi bi-telephone-fill me-2"></i>{phone_num}
                  </div>
                )}
                {formattedAddress && (
                  <div className={styles.contactItem}>
                    <i className="bi bi-geo-alt-fill me-2"></i>{formattedAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Google Account Information */}
            {profile_pic && profile_pic.startsWith('http') && (
              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>
                  <i className="bi bi-google me-2"></i>Google Account
                </h3>
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <i className="bi bi-check-circle-fill me-2" style={{color: '#4285f4'}}></i>
                    Connected with Google Account
                  </div>
                  <div className={styles.contactItem}>
                    <i className="bi bi-image-fill me-2"></i>
                    Profile picture synced from Google
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.profileActions}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate(`/profile-edit/${customerId}`)}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
