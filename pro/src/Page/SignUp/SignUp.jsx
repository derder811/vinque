import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';

export default function SignupPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState('customer');
  const [businessPermit, setBusinessPermit] = useState('');
  const [password, setPassword] = useState('');
  const [recheckPassword, setRecheckPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRecheckPassword, setShowRecheckPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous error messages

    // Phone number validation - must be exactly 11 digits
    if (!/^\d{11}$/.test(phone)) {
      setErrorMessage('Please enter a valid 11-digit phone number.');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    if (password !== recheckPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (role === 'seller' && !businessPermit.trim()) {
      alert('Please enter your business permit.');
      return;
    }

    const payload = {
      name: username.trim(),
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      password: password.trim(),
      role: role === 'customer' ? 'Customer' : 'Seller',
      businessPermit: role === 'seller' ? businessPermit.trim() : null,
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Signup failed');
      }

      alert('Signup successful!');
      navigate('/login');
    } catch (error) {
      alert('Signup failed. ' + error.message);
      console.error(error);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'recheckPassword') {
      setShowRecheckPassword(!showRecheckPassword);
    }
  };

  return (
    <main className={styles['signup-page']}>
      <form className={styles['signup-form']} onSubmit={handleSignup}>
        <h1 className={styles['signup-title']}>Create an Account</h1>
        
        {errorMessage && (
          <div className={styles['error-message']}>
            {errorMessage}
          </div>
        )}

        <fieldset className={styles['form-group']}>
          <legend className={styles['form-label']}>I am a:</legend>
          <div className={styles['radio-group']}>
            <label className={styles['radio-label']}>
              <input type="radio" name="role" value="customer" checked={role === 'customer'} onChange={() => setRole('customer')} className={styles['radio-input']} />
              Customer
            </label>
            <label className={styles['radio-label']}>
              <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} className={styles['radio-input']} />
              Seller
            </label>
          </div>
        </fieldset>

        <div className={styles['form-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="username" className={styles['form-label']}>
              {role === 'seller' ? 'Store Name' : 'Username'}
            </label>
            <input type="text" id="username" name="username" className={styles['form-input']} placeholder={role === 'seller' ? 'Enter your store name' : 'Choose a username'} required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="email" className={styles['form-label']}>Email</label>
            <input type="email" id="email" name="email" className={styles['form-input']} placeholder="example@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className={styles['form-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="first_name" className={styles['form-label']}>First Name</label>
            <input type="text" id="first_name" name="first_name" className={styles['form-input']} placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="last_name" className={styles['form-label']}>Last Name</label>
            <input type="text" id="last_name" name="last_name" className={styles['form-input']} placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className={styles['form-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="password" className={styles['form-label']}>Password</label>
            <div className={styles['password-input-group']}>
              <input type={showPassword ? 'text' : 'password'} id="password" name="password" className={styles['form-input']} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <button type="button" onClick={() => togglePasswordVisibility('password')} className={styles['toggle-password-btn']}>
                {showPassword ? '🔓' : '🔒'}
              </button>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="recheckPassword" className={styles['form-label']}>Re-enter Password</label>
            <div className={styles['password-input-group']}>
              <input type={showRecheckPassword ? 'text' : 'password'} id="recheckPassword" name="recheckPassword" className={styles['form-input']} value={recheckPassword} onChange={(e) => setRecheckPassword(e.target.value)} required />
              <button type="button" onClick={() => togglePasswordVisibility('recheckPassword')} className={styles['toggle-password-btn']}>
                {showRecheckPassword ? '🔓' : '🔒'}
              </button>
            </div>
          </div>
        </div>

        <div className={styles['form-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="phone" className={styles['form-label']}>Phone Number</label>
            <input type="text" id="phone" name="phone" className={styles['form-input']} required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="address" className={styles['form-label']}>Address</label>
            <input type="text" id="address" name="address" className={styles['form-input']} required value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        {role === 'seller' && (
          <div className={styles['form-group']}>
            <label htmlFor="businessPermit" className={styles['form-label']}>Business Permit</label>
            <input type="text" id="businessPermit" name="businessPermit" className={styles['form-input']} value={businessPermit} onChange={(e) => setBusinessPermit(e.target.value)} required placeholder="Enter your business permit number" />
          </div>
        )}

        <button type="submit" className={styles['submit-btn']}>Sign Up</button>
      </form>
    </main>
  );
}
