// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import GoogleSignUp from "../../Compo/GoogleSignUp/GoogleSignUp";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setIsLoading(true);

    try {
      // Try to use environment variable, fallback to hardcoded URL
      const apiUrl = import.meta.env.VITE_API_URL || "";
      
      // Skip server check and proceed directly to login
      const response = await fetch(`${apiUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Login failed");
      }

      const user = data.user;

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("history_id", user.history_id);
      localStorage.setItem("first_name", user.First_name);
      localStorage.setItem("last_name", user.Last_name);

      // Redirect based on role
      if (user.role === "Seller" && user.seller_id) {
        localStorage.setItem("seller_id", user.seller_id);
        navigate(`/seller/home/${user.seller_id}`);
      } else if (user.role === "Customer" && user.customer_id) {
        localStorage.setItem("customer_id", user.customer_id);
        localStorage.removeItem("seller_id");
        navigate(`/home/${user.customer_id}`);
      } else if (user.role === "Admin" && user.user_id) {
        localStorage.setItem("user_id", user.user_id);
        navigate(`/A_home/${user.user_id}`);
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-page"]}>
      <form className={styles["login-form"]} onSubmit={handleLogin}>
        <h2 className={styles["form-title"]}>Login</h2>

        {error && <p className={styles["error-message"]}>{error}</p>}

        <div className={styles["form-group"]}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles["form-input"]}
            required
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="password">Password</label>
          <div className={styles["password-input-container"]}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles["form-input"]}
              required
            />
            <span
              className={styles["password-toggle-icon"]}
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🔓" : "🔒"}
            </span>
          </div>
        </div>

        <div className={styles["button-group"]}>
          <button type="submit" className={styles["login-btn"]} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <button
            onClick={() => navigate("/signup")}
            className={styles["signup-btn"]}
            type="button"
          >
            Sign Up
          </button>
        </div>
        
        <GoogleSignUp />
      </form>
    </div>
  );
}
