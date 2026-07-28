# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your ElimuNova AI application.

## 🔧 Prerequisites

- Google Cloud Console account
- Your application running on localhost:3000 (for development)

## 📋 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "ElimuNova AI"
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "ElimuNova AI"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email for testing)

4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "ElimuNova AI Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

### 4. Get Your Credentials

1. After creating the OAuth client, you'll see:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value

### 5. Update Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

## 🚀 How It Works

### User Registration Flow:
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with user data
5. System creates user account with default "STUDENT" role
6. User is redirected to appropriate dashboard

### User Sign-in Flow:
1. User clicks "Continue with Google"
2. If account exists, user is signed in
3. If account doesn't exist, new account is created
4. User is redirected to appropriate dashboard

## 🔒 Security Features

- **Automatic Account Creation**: New users get "STUDENT" role by default
- **Email Verification**: Google handles email verification
- **Profile Sync**: User's Google profile picture and name are synced
- **Secure Tokens**: JWT tokens are used for session management

## 🎯 User Experience

### For New Users:
- Click "Continue with Google" on sign-up page
- Grant permissions on Google
- Automatically redirected to student dashboard
- Can be enrolled by school admin later

### For Existing Users:
- Click "Continue with Google" on sign-in page
- Automatically signed in with existing account
- Redirected to appropriate dashboard based on role

## 🛠️ Troubleshooting

### Common Issues:

1. **"Error 400: redirect_uri_mismatch"**
   - Check that redirect URI in Google Console matches exactly
   - Ensure no trailing slashes

2. **"Error 403: access_denied"**
   - Check OAuth consent screen configuration
   - Ensure test users are added for development

3. **"Error 401: invalid_client"**
   - Verify Client ID and Client Secret are correct
   - Check environment variables are loaded properly

### Testing:

1. Clear browser cookies and cache
2. Test with different Google accounts
3. Check browser console for errors
4. Verify environment variables in server logs

## 📱 Production Deployment

When deploying to production:

1. Update Google Console with production domain
2. Add production redirect URIs
3. Update environment variables
4. Test thoroughly before going live

## 🎉 Benefits

- **Faster Registration**: No need to fill forms
- **Better Security**: Google handles password security
- **User Convenience**: One-click sign-in
- **Reduced Friction**: Higher conversion rates
- **Trust Factor**: Users trust Google authentication

Your ElimuNova AI application now supports both traditional email/password and Google OAuth authentication! 🚀
