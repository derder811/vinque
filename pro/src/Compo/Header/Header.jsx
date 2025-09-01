import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./Header.module.css";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Header({ showSearchBar = true, showItems = true, isSeller = false, onSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.customer_id && !parsedUser.profile_pic) {
        fetch(`${API_URL}/api/header/search?customer_id=${parsedUser.customer_id}`)
          .then((res) => res.json())
          .then((json) => {
            if (json.status === "success" && json.profile_pic) {
              const updatedUser = { ...parsedUser, profile_pic: json.profile_pic };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          })
          .catch((err) => {
            console.error("❌ Failed to fetch profile pic:", err);
          });
      }
    }
  }, []);

  const handleSearchSubmit = () => {
    if (!searchTerm.trim()) return;
    onSearch?.(searchTerm);

    if (user?.customer_id) {
      navigate(`/home/${user.customer_id}?q=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate(`/home?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  const handleNavigation = async (path) => {
    switch (path) {
      case "profile":
        user?.customer_id && navigate(`/profile/${user.customer_id}`);
        break;
      case "store":
        user?.seller_id && navigate(`/store/${user.seller_id}`);
        break;
      case "items":
        user?.customer_id && navigate(`/items/${user.customer_id}`);
        break;
      case "logout":
        if (user?.user_id && user?.role) {
          try {
            await fetch(`${API_URL}/api/logout`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.user_id,
                role: user.role,
              }),
            });
          } catch (err) {
            console.error("Logout failed:", err);
          }
        }
        localStorage.removeItem("user");
        localStorage.removeItem("customer_id");
        localStorage.removeItem("seller_id");
        localStorage.removeItem("history_id");
        navigate("/login");
        break;
      default:
        break;
    }
  };

  const handleLogoClick = () => {
    if (user?.seller_id) navigate(`/seller/home/${user.seller_id}`);
    else if (user?.customer_id) navigate(`/home/${user.customer_id}`);
    else navigate(`/`);
  };

  const isExternalUrl = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  };

  const profileSrc = user?.profile_pic
    ? isExternalUrl(user.profile_pic)
      ? user.profile_pic
      : `${API_URL}/uploads/${user.profile_pic.replace(/^\/?uploads\/?/, "")}`
    : "/profile_icon.png";

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={handleLogoClick}>
        <img src="/Vinque_logo.png" alt="Vinque Logo" className={styles.logoImage} />
        <span>Vinque</span>
      </div>

      {showSearchBar && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.search}
            placeholder="Search here:"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.searchBtn} onClick={handleSearchSubmit}>
            🔍
          </button>
        </div>
      )}

      <div className={styles.profileWrapper}>
        <div className={styles.profile}>
          <img src={profileSrc} alt="profile icon" className={styles.profileIcon} />
        </div>
        <div className={styles.dropdown}>
          <ul>
            {!isSeller && user?.customer_id && !location.pathname.includes("profile") && (
              <li onClick={() => handleNavigation("profile")}>Profile</li>
            )}
            {isSeller && user?.seller_id && !location.pathname.includes("store") && (
              <li onClick={() => handleNavigation("store")}>Store</li>
            )}
            {showItems && user?.customer_id && !location.pathname.includes("items") && (
              <li onClick={() => handleNavigation("items")}>Items</li>
            )}
            <li onClick={() => handleNavigation("logout")}>Logout</li>
          </ul>
        </div>
      </div>
    </header>
  );
}
