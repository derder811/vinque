import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import styles from "./ProfileEditPage.module.css";

export default function ProfileEditPage() {
  const customerId = localStorage.getItem("customer_id");
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone_num: "",
    Address: "",
    about_info: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("/profile_icon.png");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!customerId) {
      setErrorMsg("User ID missing");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/profile-info/${customerId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

        setProfile({
          username: data.username || "",
          email: data.email || "",
          phone_num: data.phone_num || "",
          Address: data.Address || "",
          about_info: data.about_info || "",
        });

        if (data.profile_pic) {
          // Handle both Google profile pictures (full URLs) and local uploads
          const profilePicUrl = data.profile_pic.startsWith('http') 
            ? data.profile_pic 
            : `/uploads/${data.profile_pic}`;
          setAvatarPreview(profilePicUrl);
        }
      } catch (error) {
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setErrorMsg(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image must be less than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const { username, email, phone_num, Address } = profile;

    if (!username.trim() || !email.trim() || !phone_num.trim() || !Address.trim()) {
      setErrorMsg("All fields except About and Profile Image are required.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Invalid email format.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("username", profile.username);
    formData.append("email", profile.email);
    formData.append("phone_num", profile.phone_num);
    formData.append("Address", profile.Address);
    formData.append("about_info", profile.about_info || "");

    if (avatarFile) {
      formData.append("profile_image", avatarFile);
    }

    try {
      const res = await fetch(`http://localhost:3000/api/profile-update/${customerId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setSuccessMsg("✅ Profile updated successfully!");
      setTimeout(() => navigate(`/profile/${customerId}`), 1800);
    } catch (err) {
      setErrorMsg(err.message || "Profile update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <Header showSearchBar={false} />
      <div className={styles.container}>
        <h1>Edit Profile</h1>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <label className={styles.avatarLabel}>
              <img src={avatarPreview} alt="Profile" className={styles.avatarImage} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className={styles.avatarInput}
              />
              <span className={styles.avatarEditText}>Change Photo</span>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={profile.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
              placeholder="e.g. yourname@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone_num"
              value={profile.phone_num}
              onChange={handleChange}
              required
              placeholder="e.g. 09XXXXXXXXX"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Address</label>
            <input
              type="text"
              name="Address"
              value={profile.Address}
              onChange={handleChange}
              required
              placeholder="Enter your full address"
            />
          </div>

          <div className={styles.formGroup}>
            <label>About Me</label>
            <textarea
              name="about_info"
              value={profile.about_info}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us something about you..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={styles.submitButton}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </>
  );
}
