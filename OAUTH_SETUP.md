# OAuth Setup Guide

This guide will help you set up OAuth authentication with Google and GitHub for your InfraAudit application.

## Prerequisites

- A Google account for Google OAuth setup
- A GitHub account for GitHub OAuth setup
- Access to your application's `.env` file

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**

### 2. Configure OAuth Consent Screen

1. Click on **OAuth consent screen** in the left sidebar
2. Choose **External** user type (unless you're in a G Suite organization)
3. Fill out the required fields:
   - **App name**: InfraAudit
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add the following scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue

### 3. Create OAuth 2.0 Credentials

1. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
2. Choose **Web application** as the application type
3. Add these authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
4. Click **Create**
5. Copy the **Client ID** and **Client Secret**

### 4. Update Environment Variables

Add these to your `.env` file:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## GitHub OAuth Setup

### 1. Create a GitHub OAuth App

1. Go to **GitHub Settings** > **Developer settings** > **OAuth Apps**
2. Click **New OAuth App**
3. Fill out the form:
   - **Application name**: InfraAudit
   - **Homepage URL**: `http://localhost:5000` (for development) or your production URL
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback` (for development)
   - **Application description**: Optional

### 2. Get OAuth Credentials

1. After creating the app, you'll see the **Client ID**
2. Click **Generate a new client secret** to get the **Client Secret**
3. Copy both values

### 3. Update Environment Variables

Add these to your `.env` file:
```
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Final Configuration

Your complete `.env` file should include:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Base URL for OAuth callbacks
BASE_URL=http://localhost:5000
```

## Testing the Setup

1. Restart your application: `npm run dev`
2. Navigate to the login page: `http://localhost:5000/auth`
3. Click on "Continue with Google" or "Continue with GitHub"
4. Complete the OAuth flow
5. You should be redirected back to your application and logged in

## Production Deployment

When deploying to production:

1. Update the `BASE_URL` in your `.env` file to your production domain
2. Add your production callback URLs to both Google and GitHub OAuth app settings:
   - Google: `https://yourdomain.com/api/auth/google/callback`
   - GitHub: `https://yourdomain.com/api/auth/github/callback`

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: Make sure the callback URLs in your OAuth app settings exactly match the URLs in your application
2. **"invalid_client" error**: Check that your Client ID and Client Secret are correct
3. **User not found errors**: The application will automatically create new users for OAuth logins

### Database Schema

The application automatically handles OAuth users by:
- Making the password field optional for OAuth users
- Storing OAuth provider and ID for account linking
- Creating usernames from OAuth profile data
- Auto-starting trials for new OAuth users

## Security Notes

- Never commit OAuth credentials to version control
- Use different OAuth apps for development and production
- Regularly rotate your OAuth client secrets
- Monitor OAuth app usage in Google Cloud Console and GitHub settings 