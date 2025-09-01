import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './OTPVerification.module.css';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  // Get user data from navigation state
  const userData = location.state?.user;
  const isNewUser = location.state?.isNewUser;

  useEffect(() => {
    // Redirect if no user data
    if (!userData) {
      navigate('/login');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userData, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      
      const response = await fetch(`${apiUrl}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userData.user_id,
          otp_code: otpCode
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userId', userData.user_id.toString());

        // Navigate to appropriate dashboard
        if (userData.role === 'Seller') {
          navigate(`/seller/home/${userData.user_id}`);
        } else {
          navigate(`/home/${userData.user_id}`);
        }
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      
      const response = await fetch(`${apiUrl}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userData.user_id,
          email: userData.email
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setTimeLeft(600); // Reset timer to 10 minutes
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
        alert('New OTP sent to your email!');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={styles.otpPage}>
      <div className={styles.otpContainer}>
        <div className={styles.otpHeader}>
          <h1 className={styles.otpTitle}>Email Verification</h1>
          <p className={styles.otpSubtitle}>
            We've sent a 6-digit verification code to
          </p>
          <p className={styles.emailAddress}>{userData.email}</p>
        </div>

        <form onSubmit={handleVerifyOtp} className={styles.otpForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.otpInputContainer}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={styles.otpInput}
                disabled={isLoading}
              />
            ))}
          </div>

          <div className={styles.timerContainer}>
            {timeLeft > 0 ? (
              <p className={styles.timer}>
                Code expires in: <span className={styles.timeLeft}>{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className={styles.expired}>Code has expired</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.verifyButton}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className={styles.resendContainer}>
            <p className={styles.resendText}>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              className={styles.resendButton}
              disabled={!canResend || isLoading}
            >
              {canResend ? 'Resend Code' : `Resend in ${formatTime(timeLeft)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}