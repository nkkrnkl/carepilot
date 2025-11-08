# Auth0 404 Error Troubleshooting

## Issue
Getting 404 errors when accessing Auth0 routes like `/auth/login` or `/auth/logout`.

## Solution Steps

### 1. Verify Environment Variables
Make sure your `.env.local` file exists in the root directory and contains:
```env
AUTH0_SECRET=b87243fb5f48bfa065665382caf3f383a61c22e1b79cddffe8eb230bd0636e11
AUTH0_DOMAIN=dev-mkzc2baz7coa6cg6.us.auth0.com
AUTH0_CLIENT_ID=ooKrOZCVndrxGt4OHcj8iF9VGIqSGSnC
AUTH0_CLIENT_SECRET=DPAvrTmgF-hnZEwwPZN2l_iw8YLn0_wPWww2pd_OPCLWFAHBtadMzQjm8_ex3-wv
APP_BASE_URL=http://localhost:3000
```

**Important**: Make sure `APP_BASE_URL` matches the port your dev server is running on.

### 2. Restart the Dev Server
After creating or updating `.env.local`, you MUST restart the dev server:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Verify Middleware is Working
Check that `middleware.ts` exists in the root directory and contains:
```typescript
import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
```

### 4. Check Auth0 Dashboard Configuration
In your Auth0 Dashboard (https://manage.auth0.com/):
1. Go to Applications → Your Application
2. Verify these URLs are set:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

### 5. Test the Routes
Try accessing these URLs directly in your browser:
- `http://localhost:3000/auth/login` - Should redirect to Auth0 login
- `http://localhost:3000/auth/logout` - Should log you out
- `http://localhost:3000/auth/callback` - This is called by Auth0 after login

### 6. Check Browser Console
Open browser DevTools (F12) and check:
- Console for any JavaScript errors
- Network tab for failed requests

### 7. Check Server Logs
Look at your terminal where `npm run dev` is running for any error messages.

### 8. Verify Auth0 Client Initialization
Make sure `lib/auth0.ts` exists and contains:
```typescript
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client();
```

## Common Issues

### Issue: "Cannot find module '@auth0/nextjs-auth0'"
**Solution**: Run `npm install @auth0/nextjs-auth0`

### Issue: "AUTH0_SECRET is required"
**Solution**: Make sure `.env.local` exists and contains `AUTH0_SECRET`

### Issue: Middleware not executing
**Solution**: 
1. Make sure `middleware.ts` is in the root directory (not in `src/`)
2. Restart the dev server
3. Check that the file is not in `.gitignore`

### Issue: Routes return 404 even after setup
**Solution**:
1. Clear `.next` folder: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## Still Having Issues?

1. Check the Auth0 Next.js SDK documentation: https://github.com/auth0/nextjs-auth0
2. Verify your Next.js version is compatible: `npm list next`
3. Check Auth0 logs in the Auth0 Dashboard
4. Try creating a minimal test page to verify Auth0 is working

