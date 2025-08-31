// server.js
import express from "express";
import pool from './database.js'; // Assuming database.js sets up and exports the pool
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs'; // Import file system module

// CONFIG
// For production, these should be environment variables.
const PORT = process.env.PORT || 4280;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// __dirname replacement for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Multer file filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false); // Use MulterError for consistency
    }
};

//multer for profile_pic on the profile-page
const upload_profile = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
}).fields([
    { name: 'profile_image', maxCount: 1 }
])


// Initialize multer upload middleware for multiple files (up to 3)
//this is for other image for other pages don't change
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
}).fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
]);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// CORS setup
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'uploads' directory with proper CORS and MIME headers
app.use("/uploads", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static("uploads", {
    setHeaders: (res, path) => {
        if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
    }
}));


// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: "Server is working properly" });
});

//get all accounts
app.get("/api/accounts", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM accounts");
        res.json({ status: "success", data: rows });
    } catch (err) {
        console.error('Error fetching sellers', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve sellers" });
    } finally {
        if (connection) connection.release();
    }
});

//get all seller
app.get("/api/seller", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM seller_tb");
        res.json({ status: "success", data: rows });
    } catch (err) {
        console.error('Error fetching sellers', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve sellers" });
    } finally {
        if (connection) connection.release();
    }
});



// Signup route
app.post("/api/signup", async (req, res) => {
  let connection;
  try {
    const {
      name,
      password,
      email,
      role = "Customer",
      businessPermit,
      first_name,
      last_name,
      phone,
      address,
    } = req.body;

    if (!name || !password || !email || !first_name || !last_name || !phone || !address) {
      return res.status(400).json({
        status: "error",
        message: "All required fields must be filled.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 8 characters.",
      });
    }

    const allowedRoles = ["Admin", "Seller", "Customer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid role.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for duplicate email/phone
    const [[emailExists]] = await connection.query(
      `
      SELECT user_id FROM customer_tb WHERE email = ? OR phone_num = ?
      UNION
      SELECT user_id FROM seller_tb WHERE email = ? OR phone_num = ?
      `,
      [email.trim(), phone.trim(), email.trim(), phone.trim()]
    );
    if (emailExists) {
      await connection.rollback();
      return res.status(409).json({
        status: "error",
        message: "Email or phone number already exists.",
      });
    }

    // Business permit validation
    let finalBusinessPermit = null;
    if (role === "Seller") {
      if (!businessPermit?.trim()) {
        await connection.rollback();
        return res.status(400).json({
          status: "error",
          message: "Business permit is required for sellers.",
        });
      }

      const [[permitUsed]] = await connection.query(
        "SELECT user_id FROM accounts WHERE Business_Permit = ?",
        [businessPermit.trim()]
      );
      if (permitUsed) {
        await connection.rollback();
        return res.status(409).json({
          status: "error",
          message: "Business permit already in use.",
        });
      }

      finalBusinessPermit = businessPermit.trim();
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Insert into accounts
    const [accountResult] = await connection.query(
      "INSERT INTO accounts (username, password, role, Business_Permit) VALUES (?, ?, ?, ?)",
      [name.trim(), hashedPassword, role, finalBusinessPermit]
    );

    const user_id = accountResult.insertId;

    // Insert into role-specific table
    if (role === "Seller") {
      await connection.query(
        `INSERT INTO seller_tb 
        (user_id, business_name, First_name, Last_name, business_address, email, phone_num) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          name.trim(),
          first_name.trim(),
          last_name.trim(),
          address.trim(),
          email.trim(),
          phone.trim(),
        ]
      );
    } else if (role === "Customer") {
      await connection.query(
        `INSERT INTO customer_tb 
        (user_id, First_name, Last_name, phone_num, Address, email) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          first_name.trim(),
          last_name.trim(),
          phone.trim(),
          address.trim(),
          email.trim(),
        ]
      );
    }

    await connection.commit();
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      userId: user_id,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Signup error:", err);
    res.status(500).json({
      status: "error",
      message: "Server error",
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
});



// Login route
app.post("/api/login", async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: "error", message: "Username and password are required" });
    }

    connection = await pool.getConnection();

    const [users] = await connection.query(
      "SELECT user_id, username, password, role FROM accounts WHERE LOWER(username) = LOWER(?) LIMIT 1",
      [username.trim()]
    );

    if (users.length === 0) {
      await bcrypt.compare(password, "$2b$10$invalidPlaceholder"); // Dummy compare
      return res.status(401).json({ status: "error", message: "Invalid username or password" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ status: "error", message: "Invalid username or password" });
    }

    let seller_id = null;
    let customer_id = null;
    let firstName = "";
    let lastName = "";

    if (user.role === "Seller") {
      const [sellerResult] = await connection.query(
        "SELECT seller_id, First_name, Last_name FROM seller_tb WHERE user_id = ? LIMIT 1",
        [user.user_id]
      );
      if (sellerResult.length > 0) {
        seller_id = sellerResult[0].seller_id;
        firstName = sellerResult[0].First_name;
        lastName = sellerResult[0].Last_name;
      }
    } else if (user.role === "Customer") {
      const [customerResult] = await connection.query(
        "SELECT customer_id, First_name, Last_name FROM customer_tb WHERE user_id = ? LIMIT 1",
        [user.user_id]
      );
      if (customerResult.length > 0) {
        customer_id = customerResult[0].customer_id;
        firstName = customerResult[0].First_name;
        lastName = customerResult[0].Last_name;
      }
    } else if (user.role === "Admin") {
      // Set fixed Admin name
      firstName = "The";
      lastName = "Admin";
    }

    // Insert into accounts_history
    const [historyResult] = await connection.query(
      "INSERT INTO accounts_history (user_id, First_name, Last_name, role, Login) VALUES (?, ?, ?, ?, NOW())",
      [user.user_id, firstName, lastName, user.role]
    );

    const history_id = historyResult.insertId;

    const { password: _, ...userData } = user;

    return res.json({
      status: "success",
      message: "Login successful",
      user: {
        ...userData,
        First_name: firstName,
        Last_name: lastName,
        seller_id,
        customer_id,
        history_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});


//Header for logout
app.post("/api/logout", async (req, res) => {
  let connection;
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ status: "error", message: "Missing user_id or role" });
    }

    connection = await pool.getConnection();

    // Update the most recent login entry without logout for the same user
    const [result] = await connection.query(
      `UPDATE accounts_history 
       SET logout = NOW() 
       WHERE user_id = ? AND role = ? AND logout IS NULL 
       ORDER BY login DESC 
       LIMIT 1`,
      [user_id, role]
    );

    return res.json({ status: "success", message: "Logout recorded" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});



// Get user profile data by user ID
app.get("/api/profile/:userId", async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT username, email, role, First_name, Last_name, phone_num, Address, Business_Permit FROM accounts WHERE user_id = ?", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", data: rows[0] });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});


// Get all products
app.get("/api/products", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM product_tb");
        res.json({ status: "success", data: rows });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve products" });
    } finally {
        if (connection) connection.release();
    }
});


// Get all items for landing page
app.get("/api/card-item-all", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT 
         product_id, 
         product_name, 
         price, 
         image1_path, 
         image2_path, 
         image3_path, 
         verified, 
         description, 
         category 
       FROM product_tb`
    );

    const sanitize = (path) => {
      if (!path) return null;
      return `/uploads/${path.replace(/^\/?uploads\/+/i, "")}`;
    };

    const fixed = rows.map((item) => ({
      ...item,
      image1_path: sanitize(item.image1_path),
      image2_path: sanitize(item.image2_path),
      image3_path: sanitize(item.image3_path),
    }));

    res.json({ status: "success", data: fixed });
  } catch (err) {
    console.error("Error fetching all items:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});

// Get all products for a specific seller
app.get("/api/card-item/:sellerId", async (req, res) => {
  let connection;
  try {
    const sellerId = req.params.sellerId;
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `SELECT 
         product_id, 
         product_name, 
         price, 
         image1_path, 
         image2_path, 
         image3_path, 
         verified, 
         description, 
         category 
       FROM product_tb 
       WHERE seller_id = ?`,
      [sellerId]
    );

    const sanitize = (path) => {
      if (!path) return null;
      return `/uploads/${path.replace(/^\/?uploads\/+/i, "")}`;
    };

    const fixed = rows.map((item) => ({
      ...item,
      image1_path: sanitize(item.image1_path),
      image2_path: sanitize(item.image2_path),
      image3_path: sanitize(item.image3_path),
    }));

    res.json({ status: "success", data: fixed });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ status: "error", message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});




// Add a new product item with images
app.post("/api/add-item", (req, res) => {
  upload(req, res, async function (err) {
    const uploadedPaths = req.files ? Object.values(req.files).flat().map(f => f.path) : [];

    if (err) {
      console.error("Upload error:", err.message);
      uploadedPaths.forEach((fp) => fs.existsSync(fp) && fs.unlinkSync(fp));
      return res.status(400).json({ status: "error", message: err.message });
    }

    let connection;
    try {
      const {
        seller_id,
        product_name,
        price,
        verified,
        description,
        Historian_Name,
        Historian_Type,
        category,
      } = req.body;

      if (
        !seller_id ||
        !product_name?.trim() ||
        !price ||
        !description?.trim() ||
        !category?.trim() ||
        !verified?.trim()
      ) {
        uploadedPaths.forEach((fp) => fs.existsSync(fp) && fs.unlinkSync(fp));
        return res.status(400).json({ status: "error", message: "All fields are required" });
      }

      const isVerified = verified.toLowerCase() === "yes" ? 1 : 0;
      if (isVerified && (!Historian_Name?.trim() || !Historian_Type?.trim())) {
        uploadedPaths.forEach((fp) => fs.existsSync(fp) && fs.unlinkSync(fp));
        return res.status(400).json({ status: "error", message: "Historian details required" });
      }

      const image1_path = req.files["image1"] ? req.files["image1"][0].filename : null;
      const image2_path = req.files["image2"] ? req.files["image2"][0].filename : null;
      const image3_path = req.files["image3"] ? req.files["image3"][0].filename : null;

      connection = await pool.getConnection();
      const [result] = await connection.query(
        `INSERT INTO product_tb 
        (seller_id, product_name, price, image1_path, image2_path, image3_path, verified, description, Historian_Name, Historian_Type, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          seller_id,
          product_name.trim(),
          parseFloat(price),
          image1_path,
          image2_path,
          image3_path,
          isVerified,
          description.trim(),
          isVerified ? Historian_Name.trim() : null,
          isVerified ? Historian_Type.trim() : null,
          category.trim(),
        ]
      );

      return res.status(201).json({
        status: "success",
        message: "Item added successfully",
        itemId: result.insertId,
      });
    } catch (error) {
      console.error("DB error:", error);
      uploadedPaths.forEach((fp) => fs.existsSync(fp) && fs.unlinkSync(fp));
      return res.status(500).json({ status: "error", message: error.message });
    } finally {
      if (connection) connection.release();
    }
  });
});



// GET single item for editing
app.get("/api/edit-item/:id", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT product_id, product_name, price, image1_path, image2_path, image3_path, verified, description, Historian_Name, Historian_Type, category FROM product_tb WHERE product_id = ?", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Item not found" });
        }
        res.json({ status: "success", data: rows[0] });
    } catch (err) {
        console.error('Error fetching item for edit:', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve item for edit" });
    } finally {
        if (connection) connection.release();
    }
});


// Edit an item with or without new images
app.put("/api/edit-item/:id", upload, async (req, res) => { // Removed .fields() from upload
    let connection;
    const uploadedFilePaths = []; // To track new uploads for cleanup
    if (req.files) {
        for (const key in req.files) {
            req.files[key].forEach(file => uploadedFilePaths.push(file.path));
        }
    }

    try {
        const { id } = req.params;
        const {
            product_name,
            price,
            category,
            verified,
            Historian_Name,
            Historian_Type,
            description,
            image1_action, // 'delete' or undefined
            image1_original_path, // Only if action is 'delete'
            image2_action,
            image2_original_path,
            image3_action,
            image3_original_path,
        } = req.body;

        if (!product_name?.trim() || price === undefined || price === null || isNaN(price) || !description?.trim() || !category?.trim() || !verified?.trim()) {
            uploadedFilePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
            return res.status(400).json({ status: "error", message: "All item fields are required." });
        }

        const isVerified = verified.toLowerCase() === "yes" ? 1 : 0;
        let finalHistorianName = null;
        let finalHistorianType = null;
        if (isVerified) {
            if (!Historian_Name?.trim() || !Historian_Type?.trim()) {
                uploadedFilePaths.forEach(filePath => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });
                return res.status(400).json({ status: "error", message: "Historian Name and Type are required for verified items." });
            }
            finalHistorianName = Historian_Name.trim();
            finalHistorianType = Historian_Type.trim();
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Fetch current image paths from the database
        const [currentItem] = await connection.query("SELECT image1_path, image2_path, image3_path FROM product_tb WHERE product_id = ?", [id]);
        if (currentItem.length === 0) {
            await connection.rollback();
            uploadedFilePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
            return res.status(404).json({ status: "error", message: "Item not found." });
        }
        const oldImagePaths = currentItem[0];

        // Prepare fields for update
        const updateFields = {
            product_name: product_name.trim(),
            price: parseFloat(price),
            category: category.trim(),
            verified: isVerified,
            description: description.trim(),
            Historian_Name: finalHistorianName,
            Historian_Type: finalHistorianType,
        };

        // Handle image updates
        const files = req.files;
        const imagesToDelete = [];

        for (let i = 1; i <= 3; i++) {
            const imageFieldName = `image${i}`;
            const imageAction = req.body[`image${i}_action`];
            const originalPathKey = `image${i}_original_path`; // Used when action is 'delete' from frontend logic
            const currentDbPath = oldImagePaths[`image${i}_path`];

            if (files[imageFieldName] && files[imageFieldName][0]) {
                // New image uploaded, replace old one if it exists
                updateFields[`image${i}_path`] = files[imageFieldName][0].filename;
                if (currentDbPath) {
                    imagesToDelete.push(path.join(uploadsDir, currentDbPath));
                }
            } else if (imageAction === 'delete') {
                // Image marked for deletion, set path to null
                updateFields[`image${i}_path`] = null;
                // If there was an original path in DB, add it to deletion list
                if (currentDbPath) {
                    imagesToDelete.push(path.join(uploadsDir, currentDbPath));
                }
            }
            // If no new file and no delete action, keep the existing path (don't add to updateFields)
            // Implicitly, if it was already null in DB, it remains null.
        }

        // Construct dynamic UPDATE query
        const setClauses = [];
        const queryValues = [];
        for (const key in updateFields) {
            setClauses.push(`${key} = ?`);
            queryValues.push(updateFields[key]);
        }

        if (setClauses.length === 0) {
            await connection.rollback();
            uploadedFilePaths.forEach(filePath => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
            return res.status(400).json({ status: "error", message: "No fields to update." });
        }

        const updateQuery = `UPDATE product_tb SET ${setClauses.join(", ")} WHERE product_id = ?`;
        queryValues.push(id);

        await connection.query(updateQuery, queryValues);

        await connection.commit();

        // Delete old files after successful database update
        imagesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, unlinkErr => {
                    if (unlinkErr) console.error(`Error deleting old file ${filePath}:`, unlinkErr);
                });
            }
        });

        res.status(200).json({ status: "success", message: "Item updated successfully!" });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Error updating item:", err);
        // Clean up any newly uploaded files on error
        uploadedFilePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) fs.unlink(filePath, unlinkErr => { if (unlinkErr) console.error(`Error deleting file ${filePath}:`, unlinkErr); });
        });
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ status: "error", message: err.message });
        }
        res.status(500).json({ status: "error", message: "Failed to update item.", error: err.message });
    } finally {
        if (connection) connection.release();
    }
});


// Serve image paths correctly (get full item details)
app.get("/api/edit-item/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const [rows] = await pool.query(
      "SELECT product_name, price, category, verified, description, Historian_Name, Historian_Type, image1_path, image2_path, image3_path FROM product_tb WHERE product_id = ?",
      [productId]
    );

    if (!rows.length) {
      return res.status(404).json({ status: "error", message: "Item not found." });
    }

    const data = rows[0];
    // Prepend /uploads/ for frontend
    ["image1_path", "image2_path", "image3_path"].forEach((field) => {
      if (data[field]) {
        data[field] = "/uploads/" + data[field];
      }
    });

    res.json({ status: "success", data });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ status: "error", message: "Failed to load item." });
  }
});

//Delete Item
app.delete("/api/delete-item/:id", async (req, res) => {
  let connection;
  try {
    const productId = req.params.id;
    connection = await pool.getConnection();

    // Get current image paths
    const [rows] = await connection.query(
      "SELECT image1_path, image2_path, image3_path FROM product_tb WHERE product_id = ?",
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Item not found" });
    }

    const { image1_path, image2_path, image3_path } = rows[0];

    // Delete the item from DB
    const [deleteResult] = await connection.query(
      "DELETE FROM product_tb WHERE product_id = ?",
      [productId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Item not found or already deleted" });
    }

    // Delete images from the filesystem
    [image1_path, image2_path, image3_path].forEach((imgPath) => {
      if (imgPath) {
        const filename = imgPath.replace("/uploads/", ""); // remove /uploads/
        const fullPath = path.join(__dirname, "uploads", filename);

        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Error deleting file ${fullPath}:`, err);
            }
          });
        }
      }
    });

    res.json({ status: "success", message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ status: "error", message: "Failed to delete item" });
  } finally {
    if (connection) connection.release();
  }
});


// Get products for the homepage
app.get("/api/home-products", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT product_id, product_name, price, image1_path, verified, category
      FROM product_tb
    `);

    const fixedRows = rows.map((item) => {
      const cleanPath = (path) => {
        if (!path) return null;
        return path.startsWith("/uploads/") ? path : `/uploads/${path}`;
      };

      return {
        ...item,
        image1_path: cleanPath(item.image1_path),
      };
    });

    res.json({ status: "success", data: fixedRows });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ status: "error", message: "Failed to fetch products" });
  } finally {
    if (connection) connection.release();
  }
});


// Get detailed product info for item page
// GET: Item Details
app.get("/api/item-detail/:id", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;

    const [productRows] = await connection.query(
      `SELECT 
        product_id, 
        product_name, 
        price, 
        verified, 
        description, 
        Historian_Name, 
        Historian_Type, 
        category, 
        image1_path, 
        image2_path, 
        image3_path,
        seller_id
      FROM product_tb 
      WHERE product_id = ?`,
      [id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Item not found" });
    }

    const product = productRows[0];

    const [sellerRows] = await connection.query(
      `SELECT 
        business_name AS store_name, 
        business_address, 
        business_description 
      FROM seller_tb 
      WHERE seller_id = ?`,
      [product.seller_id]
    );

    const seller = sellerRows[0] || {
      store_name: "Unknown",
      business_address: "Not Provided",
      business_description: "No description available",
    };

    const formatImage = (path) =>
      path ? (path.startsWith("/uploads/") ? path : `/uploads/${path}`) : null;

    res.json({
      status: "success",
      data: {
        ...product,
        image1_path: formatImage(product.image1_path),
        image2_path: formatImage(product.image2_path),
        image3_path: formatImage(product.image3_path),
        store_name: seller.store_name,
        business_address: seller.business_address,
        business_description: seller.business_description,
      },
    });
  } catch (err) {
    console.error("Error fetching item details:", err);
    res.status(500).json({ status: "error", message: "Failed to load item details" });
  } finally {
    if (connection) connection.release();
  }
});

// POST record store visit
app.post("/api/visit-store", async (req, res) => {
  const { customer_id, seller_id } = req.body;

  if (!customer_id || !seller_id) {
    return res.status(400).json({ message: "Missing customer_id or seller_id" });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    await connection.query(
      "INSERT INTO store_visit (customer_id, seller_id, visited_at) VALUES (?, ?, NOW())",
      [customer_id, seller_id]
    );

    res.json({ message: "Visit recorded successfully" });
  } catch (err) {
    console.error("Failed to record visit:", err);
    res.status(500).json({ message: "Failed to record visit" });
  } finally {
    if (connection) connection.release();
  }
});


// Get product info for checkout
app.get("/api/checkout/:id", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT product_id, product_name, price, image1_path FROM product_tb WHERE product_id = ?", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Item not found" });
        }
        res.json({ status: "success", data: rows[0] });
    } catch (err) {
        console.error("Error fetching checkout:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch checkout data." });
    } finally {
        if (connection) connection.release();
    }
});


// Get all unique categories for navigation
// Express route
app.get("/api/category-nav", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT DISTINCT category FROM product_tb WHERE category IS NOT NULL AND category != ''"
    );
    const categories = rows.map(row => row.category);
    res.json({ status: "success", data: categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ status: "error", message: "Failed to fetch categories." });
  } finally {
    if (connection) connection.release();
  }
});

// Search for products by name or category
app.get("/api/header/search", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const searchTerm = req.query.q || "";
    const seller = req.query.seller || null;
    const customerId = req.query.customer_id || null;

    let query = `
      SELECT product_id, product_name, category, price, image1_path 
      FROM product_tb
    `;
    const params = [];

    if (searchTerm) {
      query += " WHERE product_name LIKE ? OR category LIKE ?";
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (seller) {
      query += searchTerm ? " AND seller_id = ?" : " WHERE seller_id = ?";
      params.push(seller);
    }

    const [rows] = await connection.query(query, params);

    const updatedRows = rows.map((item) => ({
      ...item,
      image1_path: item.image1_path?.replace(/^uploads[\\/]+/, "") || null, // strip "uploads/" if included
    }));

    // Get customer profile pic (optional)
    let profilePic = null;
    if (customerId) {
      const [profileRows] = await connection.query(
        "SELECT profile_pic FROM customer_tb WHERE customer_id = ?",
        [customerId]
      );
      const profile = profileRows[0];
      if (profile?.profile_pic) {
        profilePic = profile.profile_pic.replace(/^uploads[\\/]+/, "");
      }
    }

    res.json({
      status: "success",
      data: updatedRows,
      profile_pic: profilePic,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ status: "error", message: "Search failed." });
  } finally {
    if (connection) connection.release();
  }
});


// Seller page statistic
app.get("/api/seller-stats/:sellerId", async (req, res) => {
  const { sellerId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. ✅ Validate seller
    const [[seller]] = await connection.query(
      "SELECT business_name FROM seller_tb WHERE seller_id = ?",
      [sellerId]
    );

    if (!seller) {
      return res.status(404).json({ status: "error", message: "Seller not found" });
    }

    // 2. ✅ Total products
    const [[productRow]] = await connection.query(
      "SELECT COUNT(*) AS totalProducts FROM product_tb WHERE seller_id = ?",
      [sellerId]
    );
    const totalProducts = productRow?.totalProducts || 0;

    // 3. ✅ Total visitors to seller’s store
    const [[visitorRow]] = await connection.query(
      "SELECT COUNT(*) AS visitors FROM store_visit WHERE seller_id = ?",
      [sellerId]
    );
    const visitors = visitorRow?.visitors || 0;

    // ✅ 4. Trending (market-wide highest visit category across ALL products)
    const [[trendingRow]] = await connection.query(
      `SELECT category, SUM(visits) AS total_visits
       FROM product_tb
       GROUP BY category
       HAVING total_visits > 0
       ORDER BY total_visits DESC
       LIMIT 1`
    );
    const trending = trendingRow?.category || "N/A";

    // ✅ 5. Best-Seller (seller-specific highest visit category)
    const [[popularRow]] = await connection.query(
      `SELECT category, SUM(visits) AS total_visits
       FROM product_tb
       WHERE seller_id = ?
       GROUP BY category
       HAVING total_visits > 0
       ORDER BY total_visits DESC
       LIMIT 1`,
      [sellerId]
    );
    const popular = popularRow?.category || "N/A";

    // ✅ 6. Category pie data for this seller
    const [categories] = await connection.query(
      `SELECT category, COUNT(*) AS count
       FROM product_tb
       WHERE seller_id = ?
       GROUP BY category`,
      [sellerId]
    );

    // ✅ 7. Most viewed product for this seller
    const [[mostViewedItem]] = await connection.query(
      `SELECT product_name, description, image1_path, visits
       FROM product_tb
       WHERE seller_id = ?
       ORDER BY visits DESC
       LIMIT 1`,
      [sellerId]
    );
    const topItem = mostViewedItem || {
      product_name: "N/A",
      description: "No items yet",
      image1_path: null,
      visits: 0,
    };

    // ✅ 8. Monthly visits
    const [visitCounts] = await connection.query(
      `SELECT MONTH(visited_at) AS month, COUNT(*) AS count
       FROM store_visit
       WHERE seller_id = ? AND YEAR(visited_at) = YEAR(CURDATE())
       GROUP BY MONTH(visited_at)
       ORDER BY MONTH(visited_at)`,
      [sellerId]
    );
    const monthlyVisits = Array(12).fill(0);
    visitCounts.forEach(({ month, count }) => {
      if (month >= 1 && month <= 12) {
        monthlyVisits[month - 1] = count;
      }
    });

    // ✅ Send response
    res.status(200).json({
      status: "success",
      data: {
        businessName: seller.business_name,
        totalProducts,
        visitors,
        trending, // Market-wide trending
        popular,  // Seller-specific best category
        categories,
        mostViewedItem: topItem,
        visitsByMonth: monthlyVisits,
      },
    });
  } catch (err) {
    console.error("❌ Error in seller-stats:", err);
    res.status(500).json({
      status: "error",
      message: "Server error occurred.",
    });
  } finally {
    if (connection) connection.release();
  }
});


// Increment visits on a product
app.put("/api/visit/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const [result] = await pool.query(
      "UPDATE product_tb SET visits = visits + 1 WHERE product_id = ?",
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    res.json({ status: "success", message: "Visit incremented" });
  } catch (err) {
    console.error("Error incrementing visit count:", err);
    res.status(500).json({ status: "error", message: "Failed to increment visit count" });
  }
});

//get Profile Information 
// Express backend route
app.get("/api/profile-info/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    // Get user info from customer_tb
    const [customerRows] = await connection.query(
      `SELECT user_id, First_name, Last_name, phone_num, Address, profile_pic, email, about_info 
       FROM customer_tb WHERE customer_id = ?`,
      [id]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = customerRows[0];

    // Get username from accounts table
    const [accountRows] = await connection.query(
      `SELECT username FROM accounts WHERE user_id = ?`,
      [customer.user_id]
    );

    const username = accountRows.length > 0 ? accountRows[0].username : null;

    res.json({ ...customer, username });

  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
});

//Profile-Update
app.put("/api/profile-update/:id", (req, res, next) => {
  upload_profile(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ success: false, error: err.message });
    }

    const { id } = req.params;
    const { username, phone_num, Address, email, about_info } = req.body;

    const profile_pic =
      req.files && req.files["profile_image"] && req.files["profile_image"].length > 0
        ? req.files["profile_image"][0].filename
        : null;

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [customerResult] = await connection.query(
        "SELECT user_id FROM customer_tb WHERE customer_id = ?",
        [id]
      );

      if (!customerResult || customerResult.length === 0) {
        await connection.rollback();
        if (profile_pic) {
          const filePath = req.files["profile_image"][0].path;
          fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete orphaned image:", err);
          });
        }
        return res.status(404).json({ success: false, error: "Customer not found" });
      }

      const userId = customerResult[0].user_id;

      if (username) {
        await connection.query("UPDATE accounts SET username = ? WHERE user_id = ?", [
          username,
          userId,
        ]);
      }

      let updateQuery = `
        UPDATE customer_tb
        SET phone_num = ?, Address = ?, email = ?, about_info = ?
        ${profile_pic ? ", profile_pic = ?" : ""}
        WHERE customer_id = ?
      `;

      const updateValues = [phone_num, Address, email, about_info];
      if (profile_pic) updateValues.push(profile_pic);
      updateValues.push(id);

      await connection.query(updateQuery, updateValues);

      await connection.commit();

      res.json({
        success: true,
        message: "Profile updated successfully",
        profile_pic: profile_pic ? `/uploads/${profile_pic}` : null,
      });
    } catch (err) {
      if (connection) await connection.rollback();
      console.error("Error during profile update:", err);
      if (profile_pic) {
        const filePath = req.files["profile_image"][0].path;
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete image after error:", err);
        });
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  });
});


// GET store info and items by seller ID
// Express Backend Route: GET /api/store/:id
app.get("/api/store/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    const [storeData] = await connection.query(
      "SELECT business_name, business_description, business_address, seller_image, phone_num FROM seller_tb WHERE seller_id = ?",
      [id]
    );

    if (storeData.length === 0) {
      return res.status(404).json({ status: "fail", message: "Store not found" });
    }

    const [productCount] = await connection.query(
      "SELECT COUNT(*) AS total FROM product_tb WHERE seller_id = ?",
      [id]
    );

    const [products] = await connection.query(
      "SELECT product_id, product_name, price, category, verified, image1_path FROM product_tb WHERE seller_id = ?",
      [id]
    );

    const store = {
      ...storeData[0],
      total_products: productCount[0].total,
    };

    res.json({
      status: "success",
      store,
      products,
    });
  } catch (error) {
    console.error("Error fetching store data:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
});


//Admin
app.get("/api/A_History", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Delete logs older than 1 year
    await connection.query(`
      DELETE FROM accounts_history 
      WHERE login < DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `);

    // Fetch login/logout history with formatted time
    const [rows] = await connection.query(`
      SELECT 
        user_id,
        role,
        First_name AS firstName,
        Last_name AS lastName,
        DATE_FORMAT(Login, '%Y-%m-%d %H:%i:%s') AS login,
        DATE_FORMAT(Logout, '%Y-%m-%d %H:%i:%s') AS logout
      FROM accounts_history
      ORDER BY login DESC
    `);

    res.json({ status: "success", data: rows });

  } catch (err) {
    console.error('Error fetching login history:', err);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});





// Save order after successful PayPal payment
app.post("/api/orders", async (req, res) => {
    let connection;
    try {
        const {
            user_id,
            product_id,
            product_name,
            price,
            down_payment,
            remaining_payment,
            paypal_transaction_id,
            payer_name
        } = req.body;

        if (!user_id || !product_id || !product_name || !price || !down_payment || !remaining_payment) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields"
            });
        }

        connection = await pool.getConnection();
        const [result] = await connection.query(
            `INSERT INTO orders_tb 
             (user_id, product_id, product_name, price, down_payment, remaining_payment, paypal_transaction_id, payer_name) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, product_id, product_name, price, down_payment, remaining_payment, paypal_transaction_id, payer_name]
        );

        res.json({
            status: "success",
            message: "Order saved successfully",
            order_id: result.insertId
        });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ status: "error", message: "Failed to save order" });
    } finally {
        if (connection) connection.release();
    }
});

// Get orders for a specific user
app.get("/api/orders/:userId", async (req, res) => {
    let connection;
    try {
        const userId = req.params.userId;
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            `SELECT 
                o.order_id,
                o.product_id,
                o.product_name,
                o.price,
                o.down_payment,
                o.remaining_payment,
                o.status,
                o.order_date,
                o.paypal_transaction_id,
                o.payer_name,
                p.image1_path
             FROM orders_tb o
             LEFT JOIN product_tb p ON o.product_id = p.product_id
             WHERE o.user_id = ?
             ORDER BY o.order_date DESC`,
            [userId]
        );

        // Format the data for frontend
        const formattedOrders = rows.map(order => {
            const formatImage = (path) => {
                if (!path) return null;
                return path.startsWith("/uploads/") ? path : `/uploads/${path}`;
            };
            
            return {
                order_id: order.order_id,
                product_id: order.product_id,
                product_name: order.product_name,
                price: order.price,
                down_payment: order.down_payment,
                remaining_payment: order.remaining_payment,
                status: order.status,
                order_date: order.order_date,
                paypal_transaction_id: order.paypal_transaction_id,
                payer_name: order.payer_name,
                image_path: formatImage(order.image1_path)
            };
        });

        res.json({ status: "success", orders: formattedOrders });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve orders" });
    } finally {
        if (connection) connection.release();
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ status: "error", message: "Endpoint not found" });
});

// Function to create orders table if it doesn't exist
async function createOrdersTable() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders_tb (
                order_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                down_payment DECIMAL(10, 2) NOT NULL,
                remaining_payment DECIMAL(10, 2) NOT NULL,
                paypal_transaction_id VARCHAR(255),
                payer_name VARCHAR(255),
                status ENUM('Pending', 'Complete') DEFAULT 'Pending',
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES product_tb(product_id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Orders table created or already exists');
    } catch (err) {
        console.error('❌ Error creating orders table:', err);
    } finally {
        if (connection) connection.release();
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 CORS allowed from: ${FRONTEND_URL}`);
    
    // Create orders table on startup
    await createOrdersTable();
});