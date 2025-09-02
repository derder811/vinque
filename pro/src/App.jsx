import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './Context/CartContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Pages
import AdminPage from "./Page/AdminPage/Admin";
import LandingPage from "./Page/LandingPage/LandingPage";
import Login from "./Page/Login/Login";
import SignupPage from "./Page/SignUp/SignUp";
import HomePage from "./Page/HomePage/HomePage";
import ItemsPage from "./Page/HomePage/ItemsPage/ItemsPage";
import ItemDetailPage from "./Page/HomePage/ItemDetailPage/ItemDetailPage";
import ProcessCheckoutItem from "./Page/HomePage/ProcessItemPage/ProcessItemPage";
import Profile from "./Page/HomePage/ProfilePage/ProfilePage";
import ProfileEditPage from "./Page/HomePage/ProfilePage/ProfileEditPage";
import Store from "./Page/HomePage/StorePage/StorePage";
import SellerPage from "./Page/SellerPage/SellerPage";
import SPAddItem from "./Page/SellerPage/AddItem/SellerPageAddItem";
import SPViewItems from "./Page/SellerPage/ViewItems/SellerPageViewItems";
import SPEditItem from "./Page/SellerPage/EditItem/SellerPageEditItem";
import SellerOrderManagement from "./Page/SellerPage/OrderManagement/SellerOrderManagement";
import OTPVerification from "./Page/OTPVerification/OTPVerification";
import ShopPage from "./Page/HomePage/ShopPage/ShopPage";
import AboutPage from "./Page/HomePage/AboutPage/AboutPage";

function App() {
  // TODO: Replace with your actual Google OAuth Client ID
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id-here";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <CartProvider>
        <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/home/:id" element={<HomePage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
        <Route path="/about/:id" element={<AboutPage />} />
        <Route path="/items/:id" element={<ItemsPage />} />
        <Route path="/item-detail/:id" element={<ItemDetailPage />} />
        <Route path="/checkout/:id" element={<ProcessCheckoutItem />} />
        <Route path="/store/:id" element={<Store />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/profile-edit/:id" element={<ProfileEditPage />} />

        {/* Seller Routes */}
        <Route path="/seller/home/:id" element={<SellerPage />} />
        <Route path="/seller/add-item/:id" element={<SPAddItem />} />
        <Route path="/seller/view-items/:id" element={<SPViewItems />} />
        <Route path="/seller/edit-item/:id" element={<SPEditItem />} />
        <Route path="/seller/orders/:id" element={<SellerOrderManagement />} />
        
        {/* Admin Route */}
        <Route path="/A_home/:id" element={<AdminPage />} />
      </Routes>
        </Router>
      </CartProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
