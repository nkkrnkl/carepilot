# Restarting the Dev Server

## Quick Start

1. **Stop the current server** (if running):
   - Press `Ctrl+C` in the terminal where `npm run dev` is running
   - Or close the terminal window

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Wait for the server to start** - You should see:
   ```
   ▲ Next.js 16.0.1
   - Local:        http://localhost:3000
   ```

## Verification Checklist

After restarting, verify:

- [ ] Server starts without errors
- [ ] No Auth0 configuration errors in the console
- [ ] Can access `http://localhost:3000`
- [ ] Can access `http://localhost:3000/auth/login` (should redirect to Auth0)
- [ ] Navbar shows "Sign In" button when not logged in

## Testing Auth0 Routes

After restart, test these URLs:

1. **Login**: `http://localhost:3000/auth/login`
   - Should redirect to Auth0 login page

2. **Home**: `http://localhost:3000`
   - Should show the landing page

3. **Sign In Page**: `http://localhost:3000/signin`
   - Should show the sign-in page with Auth0 button

## Troubleshooting

If you still see 404 errors:

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verify environment variables**:
   ```bash
   cat .env.local | grep AUTH0
   ```

3. **Check middleware is working**:
   - Look for any errors in the terminal
   - Check browser console for errors

4. **Verify Auth0 Dashboard**:
   - Go to https://manage.auth0.com/
   - Check Allowed Callback URLs include `http://localhost:3000/auth/callback`
   - Check Allowed Logout URLs include `http://localhost:3000`

## Environment Variables Required

Make sure `.env.local` contains:
- `AUTH0_SECRET`
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `APP_BASE_URL=http://localhost:3000`

