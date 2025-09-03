// server.js
import 'dotenv/config'; // Load environment variables
import express from "express";
import pool from './database.js'; // Assuming database.js sets up and exports the pool
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs'; // Import file system module
import nodemailer from 'nodemailer'; // Import nodemailer for OTP emails

// CONFIG
// For production, these should be environment variables.
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5176';

// Email configuration for OTP
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Add to .env file
        pass: process.env.EMAIL_PASS || 'your-app-password' // Add to .env file
    }
});

// OTP utility functions
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

async function sendOTPEmail(email, otp, firstName = '') {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Your Login Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #6b8e23; text-align: center;">Vinque - Login Verification</h2>
                <p>Hello ${firstName},</p>
                <p>Your verification code is:</p>
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #6b8e23; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message from Vinque. Please do not reply.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
}

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
    origin: [FRONTEND_URL, 'http://localhost:5176', 'http://localhost:5177'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'uploads' directory with proper CORS and MIME headers
app.use("/uploads", (req, res, next) => {
    const allowedOrigins = [FRONTEND_URL, 'http://localhost:5176', 'http://localhost:5177'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
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

//get pending sellers for admin approval
app.get("/api/admin/pending-sellers", async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT s.user_id, s.business_name, s.First_name, s.Last_name, s.email, s.phone_num, s.approval_status, a.Business_Permit as business_number
             FROM seller_tb s
             LEFT JOIN accounts a ON s.user_id = a.user_id
             WHERE s.approval_status = 'pending' 
             ORDER BY s.seller_id DESC`
        );
        res.json({ status: "success", data: rows });
    } catch (err) {
        console.error('Error fetching pending sellers', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve pending sellers" });
    } finally {
        if (connection) connection.release();
    }
});

//approve seller account
app.put("/api/admin/approve-seller/:userId", async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await pool.getConnection();
        const [result] = await connection.query(
            "UPDATE seller_tb SET approval_status = 'approved' WHERE user_id = ? AND approval_status = 'pending'",
            [userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: "error", 
                message: "Seller not found or already processed" 
            });
        }
        
        res.json({ 
            status: "success", 
            message: "Seller approved successfully" 
        });
    } catch (err) {
        console.error('Error approving seller', err);
        res.status(500).json({ status: "error", message: "Failed to approve seller" });
    } finally {
        if (connection) connection.release();
    }
});

//reject seller account
app.put("/api/admin/reject-seller/:userId", async (req, res) => {
    let connection;
    try {
        const { userId } = req.params;
        
        connection = await pool.getConnection();
        const [result] = await connection.query(
            "UPDATE seller_tb SET approval_status = 'rejected' WHERE user_id = ? AND approval_status = 'pending'",
            [userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: "error", 
                message: "Seller not found or already processed" 
            });
        }
        
        res.json({ 
            status: "success", 
            message: "Seller rejected successfully" 
        });
    } catch (err) {
        console.error('Error rejecting seller', err);
        res.status(500).json({ status: "error", message: "Failed to reject seller" });
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
        (user_id, business_name, First_name, Last_name, business_address, email, phone_num, business_number, approval_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          user_id,
          name.trim(),
          first_name.trim(),
          last_name.trim(),
          address.trim(),
          email.trim(),
          phone.trim(),
          finalBusinessPermit,
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



// Google OAuth signup/login route
app.post("/api/google-signup", async (req, res) => {
  console.log('🔍 Google OAuth Request received:', new Date().toISOString());
  let connection;
  try {
    // Decode the Google JWT credential
    const { credential } = req.body;
    console.log('📧 Google credential received:', credential ? 'Yes' : 'No');
    
    if (!credential) {
      console.log('❌ No credential provided');
      return res.status(400).json({
        status: "error",
        message: "Missing Google credential"
      });
    }

    // Decode JWT token (basic decode without verification for demo)
    // In production, you should verify the token with Google's public keys
    const jwtParts = credential.split('.');
    if (jwtParts.length !== 3) {
      console.log('❌ Invalid JWT format - expected 3 parts, got:', jwtParts.length);
      return res.status(400).json({
        status: "error",
        message: "Invalid Google credential format"
      });
    }
    
    const base64Url = jwtParts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const jsonPayload = atob(paddedBase64);
    
    const googleUser = JSON.parse(jsonPayload);
    const { sub: googleId, email, name, picture } = googleUser;
    console.log('👤 Google user data:', { googleId, email, name });

    if (!googleId || !email || !name) {
      console.log('❌ Missing required Google OAuth data');
      return res.status(400).json({
        status: "error",
        message: "Missing required Google OAuth data"
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user already exists by email
    console.log('🔍 Checking for existing user with email:', email.trim());
    const [existingUsers] = await connection.query(
      "SELECT user_id, username, role FROM accounts WHERE LOWER(username) = LOWER(?) OR user_id IN (SELECT user_id FROM customer_tb WHERE email = ?)",
      [email.trim(), email.trim()]
    );
    console.log('📋 Existing users found:', existingUsers);

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists, log them in
      console.log('✅ Existing user found, logging in directly');
      user = existingUsers[0];
    } else {
      // Create new user
      isNewUser = true;
      const username = email.split('@')[0]; // Use email prefix as username
      const role = "Customer";

      // Insert into accounts table (use placeholder password for Google OAuth)
      const [accountResult] = await connection.query(
        "INSERT INTO accounts (username, password, role) VALUES (?, ?, ?)",
        [username, 'GOOGLE_OAUTH_USER', role] // Placeholder password for Google OAuth users
      );

      const user_id = accountResult.insertId;

      // Parse name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Insert into customer_tb
      await connection.query(
        "INSERT INTO customer_tb (user_id, First_name, Last_name, email, profile_pic) VALUES (?, ?, ?, ?, ?)",
        [user_id, firstName, lastName, email.trim(), picture || null]
      );

      user = {
        user_id,
        username,
        role
      };
    }

    // Get additional user info
    let seller_id = null;
    let customer_id = null;
    let firstName = "";
    let lastName = "";

    if (user.role === "Customer") {
      const [customerResult] = await connection.query(
        "SELECT customer_id, First_name, Last_name FROM customer_tb WHERE user_id = ? LIMIT 1",
        [user.user_id]
      );
      if (customerResult.length > 0) {
        customer_id = customerResult[0].customer_id;
        firstName = customerResult[0].First_name;
        lastName = customerResult[0].Last_name;
      }
    }

    // Insert into accounts_history
    const [historyResult] = await connection.query(
      "INSERT INTO accounts_history (user_id, First_name, Last_name, role, Login) VALUES (?, ?, ?, ?, NOW())",
      [user.user_id, firstName, lastName, user.role]
    );

    const history_id = historyResult.insertId;

    await connection.commit();

    // Only require OTP for new users, existing users can login directly
    let requiresOTP = isNewUser;
    console.log('🔐 OTP Logic - isNewUser:', isNewUser, 'requiresOTP:', requiresOTP);
    let otp = null;
    let emailSent = false;

    if (isNewUser) {
      console.log('📧 Generating OTP for new user');
      // Generate and send OTP for new users only
      otp = generateOTP();
      const expiresAt = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes from now in UTC

      // Insert OTP into database
      await connection.query(
        "INSERT INTO otp_tb (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)",
        [user.user_id, email.trim(), otp, expiresAt]
      );

      // Send OTP email
      emailSent = await sendOTPEmail(email.trim(), otp, firstName);

      if (!emailSent) {
        console.warn('Failed to send OTP email for new user');
      }
    } else {
      console.log('✅ Existing user - skipping OTP');
    }

    const responseData = {
      status: "success",
      message: isNewUser ? "Account created successfully. Please check your email for verification code." : "Welcome back! Login successful.",
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        First_name: firstName,
        Last_name: lastName,
        seller_id,
        customer_id,
        history_id,
        email: email.trim()
      },
      isNewUser,
      requiresOTP: requiresOTP
    };
    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));
    return res.json(responseData);
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Google OAuth error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Keep the old endpoint for backward compatibility
app.post("/api/google-auth", async (req, res) => {
  let connection;
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({
        status: "error",
        message: "Missing required Google OAuth data"
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user already exists by email
    const [existingUsers] = await connection.query(
      "SELECT user_id, username, role FROM accounts WHERE LOWER(username) = LOWER(?) OR user_id IN (SELECT user_id FROM customer_tb WHERE email = ?)",
      [email.trim(), email.trim()]
    );

    let user;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User exists, log them in
      user = existingUsers[0];
    } else {
      // Create new user
      isNewUser = true;
      const username = email.split('@')[0]; // Use email prefix as username
      const role = "Customer";

      // Insert into accounts table (no password needed for Google OAuth)
      const [accountResult] = await connection.query(
        "INSERT INTO accounts (username, password, role) VALUES (?, ?, ?)",
        [username, null, role] // No password for Google OAuth users
      );

      const user_id = accountResult.insertId;

      // Parse name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Insert into customer_tb
      await connection.query(
        "INSERT INTO customer_tb (user_id, First_name, Last_name, email, profile_pic) VALUES (?, ?, ?, ?, ?)",
        [user_id, firstName, lastName, email.trim(), picture || null]
      );

      user = {
        user_id,
        username,
        role
      };
    }

    // Get additional user info
    let seller_id = null;
    let customer_id = null;
    let firstName = "";
    let lastName = "";

    if (user.role === "Customer") {
      const [customerResult] = await connection.query(
        "SELECT customer_id, First_name, Last_name FROM customer_tb WHERE user_id = ? LIMIT 1",
        [user.user_id]
      );
      if (customerResult.length > 0) {
        customer_id = customerResult[0].customer_id;
        firstName = customerResult[0].First_name;
        lastName = customerResult[0].Last_name;
      }
    }

    // Insert into accounts_history
    const [historyResult] = await connection.query(
      "INSERT INTO accounts_history (user_id, First_name, Last_name, role, Login) VALUES (?, ?, ?, ?, NOW())",
      [user.user_id, firstName, lastName, user.role]
    );

    const history_id = historyResult.insertId;

    await connection.commit();

    return res.json({
      status: "success",
      message: isNewUser ? "Account created and logged in successfully" : "Login successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        First_name: firstName,
        Last_name: lastName,
        seller_id,
        customer_id,
        history_id,
      },
      isNewUser
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Google OAuth error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message
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
        "SELECT seller_id, First_name, Last_name, approval_status FROM seller_tb WHERE user_id = ? LIMIT 1",
        [user.user_id]
      );
      if (sellerResult.length > 0) {
        const seller = sellerResult[0];
        
        // Check if seller is approved
        if (seller.approval_status !== 'approved') {
          return res.status(403).json({ 
            status: "error", 
            message: "Your seller account is pending approval. Please wait for admin approval before logging in." 
          });
        }
        
        seller_id = seller.seller_id;
        firstName = seller.First_name;
        lastName = seller.Last_name;
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

// Send OTP endpoint
app.post("/api/send-otp", async (req, res) => {
  let connection;
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({
        status: "error",
        message: "Missing user_id or email"
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get user details
    const [userResult] = await connection.query(
      "SELECT First_name FROM customer_tb WHERE user_id = ? LIMIT 1",
      [user_id]
    );

    const firstName = userResult.length > 0 ? userResult[0].First_name : '';

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes from now in UTC

    // Delete any existing unverified OTPs for this user
    await connection.query(
      "DELETE FROM otp_tb WHERE user_id = ? AND is_verified = FALSE",
      [user_id]
    );

    // Insert new OTP
    await connection.query(
      "INSERT INTO otp_tb (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)",
      [user_id, email, otp, expiresAt]
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, firstName);

    if (!emailSent) {
      await connection.rollback();
      return res.status(500).json({
        status: "error",
        message: "Failed to send OTP email"
      });
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "OTP sent successfully to your email"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Send OTP error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  } finally {
    if (connection) connection.release();
  }
});

// Verify OTP endpoint
app.post("/api/verify-otp", async (req, res) => {
  let connection;
  try {
    const { user_id, otp_code } = req.body;
    console.log("🔍 OTP Verification Request:", { user_id, otp_code });

    if (!user_id || !otp_code) {
      return res.status(400).json({
        status: "error",
        message: "Missing user_id or otp_code"
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Debug: Check all OTPs for this user
    const [allOtps] = await connection.query(
      "SELECT otp_id, otp_code, expires_at, is_verified, created_at FROM otp_tb WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    console.log("📋 All OTPs for user:", allOtps);

    // Find valid OTP (using UTC time comparison)
    const [otpResult] = await connection.query(
      "SELECT otp_id, expires_at FROM otp_tb WHERE user_id = ? AND otp_code = ? AND is_verified = FALSE AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1",
      [user_id, otp_code]
    );
    console.log("✅ Valid OTP found:", otpResult);
    console.log("🕐 Current UTC time:", new Date().toISOString());

    if (otpResult.length === 0) {
      console.log("❌ No valid OTP found for verification");
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired OTP"
      });
    }

    // Mark OTP as verified
    await connection.query(
      "UPDATE otp_tb SET is_verified = TRUE WHERE otp_id = ?",
      [otpResult[0].otp_id]
    );

    // Clean up old OTPs for this user
    await connection.query(
      "DELETE FROM otp_tb WHERE user_id = ? AND otp_id != ?",
      [user_id, otpResult[0].otp_id]
    );

    await connection.commit();

    return res.json({
      status: "success",
      message: "OTP verified successfully"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Verify OTP error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
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
        const [rows] = await connection.query("SELECT * FROM product_tb WHERE archived = 0 OR archived IS NULL");
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
         category,
         visits as view_count
       FROM product_tb 
       WHERE archived = 0 OR archived IS NULL`
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
      view_count: item.view_count || 0,
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
         p.product_id, 
         p.product_name, 
         p.price, 
         p.image1_path, 
         p.image2_path, 
         p.image3_path, 
         p.verified, 
         p.description, 
         p.category,
         p.visits as view_count
       FROM product_tb p
       WHERE p.seller_id = ? AND (p.archived = 0 OR p.archived IS NULL)`,
      [sellerId]
    );
    
    console.log('SQL query successful. Rows returned:', rows.length);
    console.log('Raw rows from database:', JSON.stringify(rows, null, 2));

    const sanitize = (path) => {
      if (!path) return null;
      return `/uploads/${path.replace(/^\/?uploads\/+/i, "")}`;
    };

    console.log('Processing rows...');
    const fixed = rows.map((item) => ({
      ...item,
      image1_path: sanitize(item.image1_path),
      image2_path: sanitize(item.image2_path),
      image3_path: sanitize(item.image3_path),
      view_count: item.view_count || 0
    }));

    console.log('Sending response...');
    res.json({ status: "success", data: fixed });
    console.log('Response sent successfully');
  } catch (err) {
    console.error('=== ERROR IN /api/card-item/:sellerId ===');
    console.error('Error details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ status: "error", message: "Server error: " + err.message });
  } finally {
    if (connection) {
      console.log('Releasing database connection...');
      connection.release();
    }
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
      WHERE archived = 0 OR archived IS NULL
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

// Track product view and return view count
app.post("/api/track-product-view", async (req, res) => {
  const { product_id, customer_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ 
      status: "error", 
      message: "Missing product_id" 
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Check if table exists and has correct structure
    try {
      const [tableInfo] = await connection.query("DESCRIBE product_views");
      const hasCustomerId = tableInfo.some(col => col.Field === 'customer_id');
      
      if (!hasCustomerId && customer_id) {
        // Add customer_id column if it doesn't exist
        await connection.query("ALTER TABLE product_views ADD COLUMN customer_id INT");
      }
    } catch (describeErr) {
      // Table doesn't exist, create it
      if (describeErr.code === 'ER_NO_SUCH_TABLE') {
        await connection.query(`
          CREATE TABLE product_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            customer_id INT,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_product_id (product_id),
            INDEX idx_customer_id (customer_id)
          )
        `);
      } else {
        throw describeErr;
      }
    }

    // Insert the product view record (or update if exists)
    if (customer_id) {
      await connection.query(
        "INSERT INTO product_views (product_id, customer_id, viewed_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE viewed_at = NOW()",
        [product_id, customer_id]
      );
    } else {
      await connection.query(
        "INSERT INTO product_views (product_id, viewed_at) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE viewed_at = NOW()",
        [product_id]
      );
    }

    // Get the total view count for this product
    const [countResult] = await connection.query(
      "SELECT COUNT(*) as viewCount FROM product_views WHERE product_id = ?",
      [product_id]
    );

    const viewCount = countResult[0].viewCount;

    res.json({ 
      status: "success", 
      message: "Product view tracked successfully",
      viewCount: viewCount
    });
  } catch (err) {
    console.error("Failed to track product view:", err);
    res.status(500).json({ 
      status: "error", 
      message: "Failed to track product view" 
    });
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
      "SELECT DISTINCT category FROM product_tb WHERE category IS NOT NULL AND category != '' AND (archived = 0 OR archived IS NULL)"
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
    const customerId = req.query.customerId || req.query.customer_id || null;

    let query = `
      SELECT product_id, product_name, category, price, image1_path 
      FROM product_tb
      WHERE (archived = 0 OR archived IS NULL)
    `;
    const params = [];

    if (searchTerm) {
      query += " AND (product_name LIKE ? OR category LIKE ?)";
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (seller) {
      query += " AND seller_id = ?";
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

// Get seller revenue analytics
app.get("/api/seller-revenue/:sellerId", async (req, res) => {
  const { sellerId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. Validate seller
    const [[seller]] = await connection.query(
      "SELECT business_name FROM seller_tb WHERE seller_id = ?",
      [sellerId]
    );

    if (!seller) {
      return res.status(404).json({ status: "error", message: "Seller not found" });
    }

    // 2. Revenue by category
    const [revenueByCategory] = await connection.query(
      `SELECT p.category, 
              COALESCE(SUM(o.price), 0) as revenue,
              COUNT(o.order_id) as orders
       FROM product_tb p
       LEFT JOIN orders_tb o ON p.product_id = o.product_id AND o.status = 'Complete'
       WHERE p.seller_id = ?
       GROUP BY p.category
       ORDER BY revenue DESC`,
      [sellerId]
    );

    // 3. Monthly revenue for current year
    const [monthlyRevenue] = await connection.query(
      `SELECT MONTH(o.order_date) as month, 
              COALESCE(SUM(o.price), 0) as revenue
       FROM orders_tb o
       JOIN product_tb p ON o.product_id = p.product_id
       WHERE p.seller_id = ? AND o.status = 'Complete' 
             AND YEAR(o.order_date) = YEAR(CURDATE())
       GROUP BY MONTH(o.order_date)
       ORDER BY MONTH(o.order_date)`,
      [sellerId]
    );

    // Fill monthly revenue array (12 months)
    const monthlyRevenueData = Array(12).fill(0);
    monthlyRevenue.forEach(({ month, revenue }) => {
      if (month >= 1 && month <= 12) {
        monthlyRevenueData[month - 1] = parseFloat(revenue) || 0;
      }
    });

    // 4. Total revenue and orders
    const [[totals]] = await connection.query(
      `SELECT COALESCE(SUM(o.price), 0) as totalRevenue,
              COUNT(o.order_id) as totalOrders
       FROM orders_tb o
       JOIN product_tb p ON o.product_id = p.product_id
       WHERE p.seller_id = ? AND o.status = 'Complete'`,
      [sellerId]
    );

    // 5. Top selling products by revenue
    const [topProducts] = await connection.query(
      `SELECT p.product_name, p.category, 
              COALESCE(SUM(o.price), 0) as revenue,
              COUNT(o.order_id) as orders
       FROM product_tb p
       LEFT JOIN orders_tb o ON p.product_id = o.product_id AND o.status = 'Complete'
       WHERE p.seller_id = ?
       GROUP BY p.product_id, p.product_name, p.category
       ORDER BY revenue DESC
       LIMIT 5`,
      [sellerId]
    );

    res.status(200).json({
      status: "success",
      data: {
        businessName: seller.business_name,
        revenueByCategory,
        monthlyRevenue: monthlyRevenueData,
        totalRevenue: parseFloat(totals.totalRevenue) || 0,
        totalOrders: totals.totalOrders || 0,
        topProducts
      }
    });
  } catch (err) {
    console.error("❌ Error in seller-revenue:", err);
    res.status(500).json({
      status: "error",
      message: "Server error occurred."
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
      "SELECT COUNT(*) AS total FROM product_tb WHERE seller_id = ? AND (archived = 0 OR archived IS NULL)",
      [id]
    );

    const [products] = await connection.query(
      "SELECT product_id, product_name, price, category, verified, image1_path, archived FROM product_tb WHERE seller_id = ? AND (archived = 0 OR archived IS NULL)",
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

// Get all purchase transactions for admin
app.get("/api/admin/purchases", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT 
        o.order_id,
        o.product_id,
        o.product_name,
        o.price,
        o.down_payment,
        o.remaining_payment,
        o.status,
        DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') AS order_date,
        o.payer_name,
        o.paypal_transaction_id,
        c.First_name AS buyer_first_name,
        c.Last_name AS buyer_last_name,
        c.email AS buyer_email,
        s.business_name,
        s.business_address,
        p.seller_id
      FROM orders_tb o
      LEFT JOIN customer_tb c ON o.user_id = c.customer_id
      LEFT JOIN product_tb p ON o.product_id = p.product_id
      LEFT JOIN seller_tb s ON p.seller_id = s.seller_id
      ORDER BY o.order_date DESC
    `);

    // Format the data for admin interface
    const formattedTransactions = rows.map(row => ({
      productId: row.product_id,
      itemName: row.product_name,
      buyer: `${row.buyer_first_name || ''} ${row.buyer_last_name || ''}`.trim() || row.payer_name || 'Unknown',
      date: row.order_date,
      businessName: row.business_name || 'Unknown Business',
      businessAddress: row.business_address || 'Unknown Address',
      price: row.price,
      status: row.status,
      transactionId: row.paypal_transaction_id
    }));

    res.json({ status: "success", data: formattedTransactions });

  } catch (err) {
    console.error('Error fetching purchase transactions:', err);
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

// Get orders for a specific seller
app.get("/api/seller-orders/:sellerId", async (req, res) => {
    let connection;
    try {
        const sellerId = req.params.sellerId;
        connection = await pool.getConnection();

        const [rows] = await connection.query(
            `SELECT 
                o.order_id,
                o.user_id,
                o.product_id,
                o.product_name,
                o.price,
                o.down_payment,
                o.remaining_payment,
                o.status,
                o.order_date,
                o.paypal_transaction_id,
                o.payer_name,
                p.image1_path,
                c.First_name,
                c.Last_name,
                c.email,
                c.phone_num,
                c.Address
             FROM orders_tb o
             LEFT JOIN product_tb p ON o.product_id = p.product_id
             LEFT JOIN customer_tb c ON (CONCAT(c.First_name, ' ', c.Last_name) LIKE CONCAT('%', o.payer_name, '%') OR o.payer_name LIKE CONCAT('%', c.First_name, ' ', c.Last_name, '%'))
             WHERE p.seller_id = ?
             ORDER BY o.order_date DESC`,
            [sellerId]
        );

        // Format the data for frontend
        const formattedOrders = rows.map(order => {
            const formatImage = (path) => {
                if (!path) return null;
                return path.startsWith("/uploads/") ? path : `/uploads/${path}`;
            };
            
            return {
                order_id: order.order_id,
                user_id: order.user_id,
                product_id: order.product_id,
                product_name: order.product_name,
                price: order.price,
                down_payment: order.down_payment,
                remaining_payment: order.remaining_payment,
                status: order.status,
                order_date: order.order_date,
                paypal_transaction_id: order.paypal_transaction_id,
                payer_name: order.payer_name,
                image_path: formatImage(order.image1_path),
                customer: {
                    first_name: order.First_name,
                    last_name: order.Last_name,
                    email: order.email,
                    phone: order.phone_num,
                    address: order.Address
                }
            };
        });

        res.json({ status: "success", orders: formattedOrders });
    } catch (err) {
        console.error('Error fetching seller orders:', err);
        res.status(500).json({ status: "error", message: "Failed to retrieve seller orders" });
    } finally {
        if (connection) connection.release();
    }
});

// Update order status (for sellers)
app.put("/api/orders/:orderId/status", async (req, res) => {
    let connection;
    try {
        const { orderId } = req.params;
        const { status, sellerId } = req.body;

        if (!status || !sellerId) {
            return res.status(400).json({
                status: "error",
                message: "Status and seller ID are required"
            });
        }

        // Validate status
        const validStatuses = ['Pending', 'Complete'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid status. Must be 'Pending' or 'Complete'"
            });
        }

        connection = await pool.getConnection();
        
        // Verify that the order belongs to the seller's products
        const [orderCheck] = await connection.query(
            `SELECT o.order_id 
             FROM orders_tb o
             LEFT JOIN product_tb p ON o.product_id = p.product_id
             WHERE o.order_id = ? AND p.seller_id = ?`,
            [orderId, sellerId]
        );

        if (orderCheck.length === 0) {
            return res.status(403).json({
                status: "error",
                message: "Order not found or you don't have permission to update this order"
            });
        }

        // Update the order status
        const [result] = await connection.query(
            "UPDATE orders_tb SET status = ? WHERE order_id = ?",
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                message: "Order not found"
            });
        }

        res.json({
            status: "success",
            message: "Order status updated successfully"
        });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ status: "error", message: "Failed to update order status" });
    } finally {
        if (connection) connection.release();
    }
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

// Function to create OTP table if it doesn't exist
async function createOTPTable() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS otp_tb (
                otp_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
            )
        `);
        console.log('✅ OTP table created or already exists');
    } catch (err) {
        console.error('❌ Error creating OTP table:', err);
    } finally {
        if (connection) connection.release();
    }
}

// Function to create product table if it doesn't exist
async function createProductTable() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_tb (
                product_id INT AUTO_INCREMENT PRIMARY KEY,
                seller_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                image1_path VARCHAR(255),
                image2_path VARCHAR(255),
                image3_path VARCHAR(255),
                verified BOOLEAN DEFAULT FALSE,
                description TEXT,
                Historian_Name VARCHAR(255),
                Historian_Type VARCHAR(255),
                category VARCHAR(100),
                visits INT DEFAULT 0,
                archived TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (seller_id) REFERENCES accounts(user_id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Product table created or already exists');
    } catch (err) {
        console.error('❌ Error creating product table:', err);
    } finally {
        if (connection) connection.release();
    }
}

// Archive product endpoint
app.put("/api/products/:productId/archive", async (req, res) => {
    let connection;
    try {
        const { productId } = req.params;
        const { sellerId } = req.body;
        
        if (!sellerId) {
            return res.status(400).json({ status: "error", message: "Seller ID is required" });
        }
        
        connection = await pool.getConnection();
        
        // Verify the product belongs to the seller
        const [product] = await connection.query(
            "SELECT seller_id FROM product_tb WHERE product_id = ?",
            [productId]
        );
        
        if (product.length === 0) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }
        
        if (product[0].seller_id !== parseInt(sellerId)) {
            return res.status(403).json({ status: "error", message: "Unauthorized to archive this product" });
        }
        
        // Archive the product
        await connection.query(
            "UPDATE product_tb SET archived = 1 WHERE product_id = ?",
            [productId]
        );
        
        res.json({ status: "success", message: "Product archived successfully" });
    } catch (err) {
        console.error('Error archiving product:', err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

// Restore product endpoint
app.put("/api/products/:productId/restore", async (req, res) => {
    let connection;
    try {
        const { productId } = req.params;
        const { sellerId } = req.body;
        
        if (!sellerId) {
            return res.status(400).json({ status: "error", message: "Seller ID is required" });
        }
        
        connection = await pool.getConnection();
        
        // Verify the product belongs to the seller
        const [product] = await connection.query(
            "SELECT seller_id FROM product_tb WHERE product_id = ?",
            [productId]
        );
        
        if (product.length === 0) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }
        
        if (product[0].seller_id !== parseInt(sellerId)) {
            return res.status(403).json({ status: "error", message: "Unauthorized to restore this product" });
        }
        
        // Restore the product
        await connection.query(
            "UPDATE product_tb SET archived = 0 WHERE product_id = ?",
            [productId]
        );
        
        res.json({ status: "success", message: "Product restored successfully" });
    } catch (err) {
        console.error('Error restoring product:', err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

// Get archived products for seller
app.get("/api/seller/:sellerId/archived-products", async (req, res) => {
    let connection;
    try {
        const { sellerId } = req.params;
        
        connection = await pool.getConnection();
        
        const [rows] = await connection.query(
            "SELECT product_id, product_name, price, category, verified, image1_path, archived FROM product_tb WHERE seller_id = ? AND archived = 1",
            [sellerId]
        );
        
        res.json({ status: "success", data: rows });
    } catch (err) {
        console.error('Error fetching archived products:', err);
        res.status(500).json({ status: "error", message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

// 404 handler - must be last
app.use((req, res) => {
    res.status(404).json({ status: "error", message: "Endpoint not found" });
});

// Start server
app.listen(PORT, async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 CORS allowed from: ${FRONTEND_URL}`);
    
    // Create tables on startup
    await createProductTable();
    await createOrdersTable();
    await createOTPTable();
});