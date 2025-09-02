import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import Sidebar from "../../../Compo/Sidebar/Sidebar";
import styles from "./SellerPageAddItem.module.css";

export default function SellerPageAddItem() {
  const navigate = useNavigate();
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState("no");
  const [historianName, setHistorianName] = useState("");
  const [historianType, setHistorianType] = useState("");
  const [description, setDescription] = useState("");
  const [itemImages, setItemImages] = useState([]);
  const [itemImagePreviews, setItemImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerId, setSellerId] = useState(null);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const revokeImagePreviews = useCallback(() => {
    itemImagePreviews.forEach(URL.revokeObjectURL);
  }, [itemImagePreviews]);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.classList.add(styles.animateEnter);
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === "Seller" && user.seller_id) {
          setSellerId(user.seller_id);
        } else {
          alert("You must be logged in as a seller to add items.");
          navigate("/login");
        }
      } catch (e) {
        alert("Invalid session. Please log in again.");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } else {
      alert("Please log in to add items.");
      navigate("/login");
    }

    return () => {
      revokeImagePreviews();
    };
  }, [navigate, revokeImagePreviews]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    const newFilesToProcess = files.filter(
      (newFile) =>
        !itemImages.some(
          (existingFile) =>
            existingFile.name === newFile.name && existingFile.size === newFile.size
        )
    );

    const totalNewImagesCount = itemImages.length + newFilesToProcess.length;

    if (totalNewImagesCount > 3) {
      alert("Maximum of 3 images allowed.");
      e.target.value = "";
      return;
    }

    const updatedImages = [...itemImages, ...newFilesToProcess];
    setItemImages(updatedImages);

    revokeImagePreviews();
    setItemImagePreviews(updatedImages.map((file) => URL.createObjectURL(file)));

    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    if (itemImagePreviews[indexToRemove]) {
      URL.revokeObjectURL(itemImagePreviews[indexToRemove]);
    }

    const updatedImages = itemImages.filter((_, index) => index !== indexToRemove);
    setItemImages(updatedImages);
    setItemImagePreviews(updatedImages.map((file) => URL.createObjectURL(file)));

    if (updatedImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!sellerId) {
      alert("Seller ID missing. Please log in again.");
      navigate("/login");
      return;
    }

    if (itemImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    if (verified === "yes" && (!historianName.trim() || !historianType.trim())) {
      alert("Historian Name and Type are required for verified items.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("seller_id", sellerId);
    formData.append("product_name", itemName.trim());
    formData.append("price", price.trim());
    formData.append("category", category.trim());
    formData.append("verified", verified);
    formData.append("description", description.trim());

    if (verified === "yes") {
      formData.append("Historian_Name", historianName.trim());
      formData.append("Historian_Type", historianType.trim());
    }

    itemImages.forEach((file, index) => {
      const fieldName = `image${index + 1}`; // image1, image2, image3
      formData.append(fieldName, file);
    });

    try {
      const response = await fetch("http://localhost:3000/api/add-item", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        alert(result.message);
        setItemName("");
        setPrice("");
        setCategory("");
        setVerified("no");
        setHistorianName("");
        setHistorianType("");
        setDescription("");
        revokeImagePreviews();
        setItemImages([]);
        setItemImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        navigate(`/seller/view-items/${sellerId}`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header showSearchBar={false} showItems={false} isSeller={true} />
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.content}>
          <form ref={formRef} className={styles.addItemForm} onSubmit={handleAddSubmit}>
            <h2 className={styles.mainHeading}>Add New Item</h2>
            <div className={styles.formGrid}>
              <div className={styles.itemPhotoSection}>
                <h3 className={styles.sectionHeading}>Item Photos (1 to 3 images)</h3>
                <div className={styles.imagePreviewsContainer}>
                  {itemImagePreviews.length > 0 ? (
                    itemImagePreviews.map((preview, index) => (
                      <div key={index} className={styles.singleImagePreview}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className={styles.itemPicture}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/150x150/d9c7b6/ffffff?text=Error";
                          }}
                        />
                        <button
                          type="button"
                          className={styles.removeImageButton}
                          onClick={() => handleRemoveImage(index)}
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noImageText}>No images uploaded yet.</p>
                  )}
                </div>
                <label htmlFor="itemImages" className={styles.uploadButton}>
                  <i className="bi bi-upload me-2"></i>Upload Photos
                </label>
                <input
                  type="file"
                  id="itemImages"
                  name="itemImages"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  multiple
                  ref={fileInputRef}
                />
              </div>

              <div className={styles.itemDescriptionSection}>
                <h3 className={styles.sectionHeading}>Item Details</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="itemName" className={styles.formLabel}>Item Name</label>
                  <input
                    type="text"
                    id="itemName"
                    className={styles.formInput}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="price" className={styles.formLabel}>Price (₱)</label>
                  <input
                    type="number"
                    id="price"
                    className={styles.formInput}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="category" className={styles.formLabel}>Category</label>
                  <input
                    type="text"
                    id="category"
                    className={styles.formInput}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="description" className={styles.formLabel}>Description</label>
                  <textarea
                    id="description"
                    className={styles.formTextarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                    required
                  />
                </div>
              </div>

              <div className={styles.verifiedSection}>
                <h3 className={styles.sectionHeading}>Verification</h3>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      name="verified"
                      value="yes"
                      checked={verified === "yes"}
                      onChange={() => setVerified("yes")}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioLabelText}>Verified</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="verified"
                      value="no"
                      checked={verified === "no"}
                      onChange={() => setVerified("no")}
                      className={styles.radioInput}
                    />
                    <span className={styles.radioLabelText}>Not Verified</span>
                  </label>
                </div>

                {verified === "yes" && (
                  <div className={`${styles.historianFields} ${styles.show}`}>
                    <div className={styles.formGroup}>
                      <label htmlFor="historianName" className={styles.formLabel}>Historian Name</label>
                      <input
                        type="text"
                        id="historianName"
                        className={styles.formInput}
                        value={historianName}
                        onChange={(e) => setHistorianName(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="historianType" className={styles.formLabel}>Historian Type</label>
                      <input
                        type="text"
                        id="historianType"
                        className={styles.formInput}
                        value={historianType}
                        onChange={(e) => setHistorianType(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding Item..." : (
                  <>
                    <i className="bi bi-plus-circle-fill me-2"></i>Add Item
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
