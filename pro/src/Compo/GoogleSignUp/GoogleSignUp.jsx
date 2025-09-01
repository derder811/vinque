import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import styles from './GoogleSignUp.module.css';

export default function GoogleSignUp() {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      
      // Send the Google credential to our backend
      const response = await fetch(`${apiUrl}/api/google-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: credentialResponse.credential
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const user = data.user;
        
        // Check if OTP verification is required
        if (data.requiresOTP) {
          // Navigate to OTP verification page with user data
          navigate('/otp-verification', {
            state: {
              user: user,
              isNewUser: data.isNewUser || false
            }
          });
        } else {
          // Store user data in localStorage for direct login (existing users)
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userId', user.user_id.toString());
          localStorage.setItem('history_id', user.history_id);
          localStorage.setItem('first_name', user.First_name);
          localStorage.setItem('last_name', user.Last_name);
          
          // Set customer_id for profile page access
          if (user.customer_id) {
            localStorage.setItem('customer_id', user.customer_id.toString());
          }
          
          // Set seller_id if user is a seller
          if (user.seller_id) {
            localStorage.setItem('seller_id', user.seller_id.toString());
          }

          // Navigate based on user role
          if (user.role === 'Seller' && user.seller_id) {
            navigate(`/seller/home/${user.seller_id}`);
          } else {
            // Navigate to customer dashboard
            navigate(`/home/${user.customer_id}`);
          }
        }
      } else {
        console.error('Google sign-up failed:', data.message);
        alert('Sign-up failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      alert('Sign-up failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google sign-up failed');
    alert('Google sign-up failed. Please try again.');
  };

  return (
    <div className={styles.googleSignUpContainer}>
      <div className={styles.divider}>
        <span>or</span>
      </div>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
      />
    </div>
  );
}