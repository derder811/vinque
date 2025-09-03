# Google OAuth Complete Fix Guide

## Current Error: "Error 400: origin_mismatch"

This error occurs because your Google Cloud Console OAuth settings don't match your current application URL.

## Step-by-Step Fix:

### 1. Update Google Cloud Console (CRITICAL)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (or create one if needed)
3. **Navigate to**: APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID**: 
   ```
   521937974102-iet5qscq0i9de3r73ovrfeqhi2lomn6m.apps.googleusercontent.com
   ```
5. **Click the Edit button** (pencil icon)
6. **Update the following fields**:

   **Authorized JavaScript origins:**
   ```
   http://localhost:5176
   http://localhost:5177
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:5176
   http://localhost:5176/
   http://localhost:5177
   http://localhost:5177/
   ```

7. **Click Save**
8. **Wait 5-10 minutes** for changes to propagate

### 2. Clear Browser Cache

1. **Chrome**: Ctrl+Shift+Delete → Select "All time" → Clear data
2. **Or use Incognito mode** for testing

### 3. Restart Your Application

1. **Stop the current server** (Ctrl+C in terminal)
2. **Restart**: `npm run dev`
3. **Access**: http://localhost:5177/

### 4. Test Google Login

1. **Go to your app**: http://localhost:5177/
2. **Click Google Sign In**
3. **Should work without errors**

## Important Notes:

- Your app is running on **port 5177**
- The `.env` file is correctly configured
- The main issue is the Google Cloud Console settings
- **You MUST update the Google Cloud Console** - this cannot be done automatically

## If Still Not Working:

1. **Double-check the Client ID** in Google Cloud Console matches your `.env` file
2. **Ensure you're using the correct project** in Google Cloud Console
3. **Try a different browser** or incognito mode
4. **Wait longer** - sometimes changes take up to 30 minutes to propagate

## Current Configuration:

- **App URLs**: http://localhost:5176/ and http://localhost:5177/
- **Client ID**: 521937974102-iet5qscq0i9de3r73ovrfeqhi2lomn6m.apps.googleusercontent.com
- **Required Origins**: http://localhost:5176, http://localhost:5177
- **Required Redirect URIs**: http://localhost:5176, http://localhost:5176/, http://localhost:5177, http://localhost:5177/

**The fix is 100% in the Google Cloud Console settings - please update them as described above!**