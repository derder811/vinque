import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../Compo/Header/Header";
import Sidebar from "../../../Compo/Sidebar/Sidebar";
import styles from "./SellerPageEditItem.module.css";

export default function SellerPageEditItem() {
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState("no");
  const [historianName, setHistorianName] = useState("");
  const [historianType, setHistorianType] = useState("");
  const [description, setDescription] = useState("");
  const [imageSlots, setImageSlots] = useState([null, null, null]);

  const formRef = useRef(null);
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const sellerId = user?.seller_id;

  useEffect(() => {
    if (formRef.current) formRef.current.classList.add(styles.animateEnter);

    const loadItemData = async () => {
      if (!productId) {
        alert("No item selected for editing.");
        return navigate(`/seller/view-items/${sellerId}`);
      }

      try {
        const response = await fetch(`http://localhost:3000/api/edit-item/${productId}`);
        const { status, data, message } = await response.json();

        if (status === "success" && data) {
          setItemName(data.product_name || "");
          setPrice(data.price || "");
          setCategory(data.category || "");
          setVerified(data.verified === 1 ? "yes" : "no");
          setHistorianName(data.Historian_Name || "");
          setHistorianType(data.Historian_Type || "");
          setDescription(data.description || "");

          const loadedImageSlots = [null, null, null];
          const addPrefix = (path) => {
            if (!path) return null;
            return path.startsWith("/uploads/") ? path : `/uploads/${path}`;
          };
          const removePrefix = (path) => {
            if (!path) return "";
            return path.replace(/^\/?uploads\//, "");
          };

          if (data.image1_path) {
            loadedImageSlots[0] = {
              url: addPrefix(data.image1_path),
              originalPath: removePrefix(data.image1_path),
              type: "keep"
            };
          }
          if (data.image2_path) {
            loadedImageSlots[1] = {
              url: addPrefix(data.image2_path),
              originalPath: removePrefix(data.image2_path),
              type: "keep"
            };
          }
          if (data.image3_path) {
            loadedImageSlots[2] = {
              url: addPrefix(data.image3_path),
              originalPath: removePrefix(data.image3_path),
              type: "keep"
            };
          }

          setImageSlots(loadedImageSlots);
        } else {
          alert(message || "Failed to fetch item.");
          navigate(`/seller/view-items/${sellerId}`);
        }
      } catch (err) {
        console.error("Error:", err);
        alert("Network error.");
        navigate(`/seller/view-items/${sellerId}`);
      }
    };

    loadItemData();

    return () => {
      imageSlots.forEach((slot) => {
        if (slot?.type === "new") URL.revokeObjectURL(slot.url);
      });
    };
  }, [productId, navigate, sellerId]);

  const handleImageReplace = (index) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (imageSlots[index]?.type === "new") {
          URL.revokeObjectURL(imageSlots[index].url);
        }

        const newSlots = [...imageSlots];
        newSlots[index] = {
          url: URL.createObjectURL(file),
          file: file,
          type: "new"
        };
        setImageSlots(newSlots);
      }
    };
    input.click();
  };

  const handleImageDelete = (index) => {
    if (index === 0) {
      alert("Image 1 cannot be deleted. You can only replace it.");
      return;
    }

    if (imageSlots[index]?.type === "new") {
      URL.revokeObjectURL(imageSlots[index].url);
    }

    const newSlots = [...imageSlots];
    if (newSlots[index]?.originalPath) {
      newSlots[index] = {
        originalPath: newSlots[index].originalPath,
        type: "delete",
        url: null,
        file: null
      };
    } else {
      newSlots[index] = null;
    }
    setImageSlots(newSlots);
  };

  const handleDeleteItem = async () => {
    if (!window.confirm("Are you sure you want to delete this entire item?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/delete-item/${productId}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.status === "success") {
        alert("Item deleted successfully!");
        navigate(`/seller/view-items/${sellerId}`);
      } else {
        alert("Error: " + json.message);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("product_name", itemName);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("verified", verified);
    formData.append("description", description);

    if (verified === "yes") {
      formData.append("Historian_Name", historianName);
      formData.append("Historian_Type", historianType);
    }

    imageSlots.forEach((slot, i) => {
      const idx = i + 1;
      if (slot?.type === "new" && slot.file) {
        formData.append(`image${idx}`, slot.file);
      } else if (slot?.type === "delete") {
        formData.append(`image${idx}_action`, "delete");
        if (slot.originalPath) {
          formData.append(`image${idx}_original_path`, slot.originalPath);
        }
      }
    });

    try {
      const res = await fetch(`http://localhost:3000/api/edit-item/${productId}`, {
        method: "PUT",
        body: formData
      });
      const json = await res.json();
      if (json.status === "success") {
        alert("Item updated successfully!");
        navigate(`/seller/view-items/${sellerId}`);
      } else {
        alert("Error: " + json.message);
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  return (
    <>
      <Header showSearchBar={false} showItems={false} isSeller={true} />
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.content}>
          <form ref={formRef} className={styles.editItemForm} onSubmit={handleSubmit}>
            <h2 className={styles.mainHeading}>Edit Item</h2>

            <div className={styles.imagePreviewRow}>
              {Array.from({ length: 3 }).map((_, i) => {
                const slot = imageSlots[i];
                return (
                  <div key={i} className={styles.imageContainer}>
                    {slot?.url ? (
                      <div className={styles.imageWrapper}>
                        <img
                          src={slot.url}
                          alt={`Preview ${i + 1}`}
                          className={styles.itemPicture}
                          onClick={() => handleImageReplace(i)}
                        />
                        <span
                          className={styles.deleteIcon}
                          onClick={() => handleImageDelete(i)}
                        >
                          x
                        </span>
                      </div>
                    ) : (
                      <div className={styles.uploadSlot} onClick={() => handleImageReplace(i)}>
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.itemDescriptionSection}>
              <h3 className={styles.sectionHeading}>Item Details</h3>
              <div className={styles.formGroup}>
                <label htmlFor="itemName" className={styles.formLabel}>Item Name</label>
                <input
                  id="itemName"
                  className={styles.formInput}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="price" className={styles.formLabel}>Price</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category" className={styles.formLabel}>Category</label>
                <input
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
                  rows="4"
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>

            <div className={styles.verifiedSection}>
              <h3 className={styles.sectionHeading}>Verified Item?</h3>
              <div className={styles.formGroup}>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      name="verified"
                      value="yes"
                      className={`${styles.radioInput} ${styles.radioYes}`}
                      checked={verified === "yes"}
                      onChange={(e) => setVerified(e.target.value)}
                    />
                    <span className={styles.radioLabelText}>Yes</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="verified"
                      value="no"
                      className={`${styles.radioInput} ${styles.radioNo}`}
                      checked={verified === "no"}
                      onChange={(e) => setVerified(e.target.value)}
                    />
                    <span className={styles.radioLabelText}>No</span>
                  </label>
                </div>
              </div>

              {verified === "yes" && (
                <div className={`${styles.historianFields} ${styles.show}`}>
                  <div className={styles.formGroup}>
                    <label htmlFor="historianName" className={styles.formLabel}>Historian Name</label>
                    <input
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

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.editButton}>Save Changes</button>
              <button type="button" className={styles.deleteItemButton} onClick={handleDeleteItem}>Delete Item</button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
