# Troubleshooting Internal Server Error

## Common Causes

### 1. Missing Environment Variables

Check that all required environment variables are set in `.env.local`:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=dev-mkzc2baz7coa6cg6.us.auth0.com
AUTH0_CLIENT_ID=ooKrOZCVndrxGt4OHcj8iF9VGIqSGSnC
AUTH0_CLIENT_SECRET=DPAvrTmgF-hnZEwwPZN2l_iw8YLn0_wPWww2pd_OPCLWFAHBtadMzQjm8_ex3-wv
AUTH0_SECRET=<your-secret>
AUTH0_BASE_URL=http://localhost:3000

# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=carepilot
AZURE_SQL_PASSWORD=abc123!!
```

### 2. Database Connection Errors

If you see database connection errors:
- Verify SQL credentials are correct
- Check Azure SQL firewall rules allow your IP address
- Ensure the database server is accessible

### 3. Auth0 Configuration Issues

If Auth0 authentication fails:
- Verify all Auth0 environment variables are set
- Check that `AUTH0_SECRET` is a 32-byte hex string (generate with `openssl rand -hex 32`)
- Ensure Auth0 application is configured correctly in Auth0 Dashboard

### 4. Check Server Logs

To see detailed error messages:
1. Check the terminal where `npm run dev` is running
2. Look for error messages in the console
3. Check browser console for client-side errors

### 5. Clear Cache and Restart

If errors persist:
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

## Debugging Steps

1. **Check which route is failing**: Look at the browser URL when the error occurs
2. **Check server logs**: The terminal running `npm run dev` will show the actual error
3. **Test API routes directly**: Visit `http://localhost:3000/api/users/role` to see the error message
4. **Verify environment variables**: Make sure `.env.local` exists and has all required variables

## Common Error Messages

### "Database connection failed"
- Check SQL credentials in `.env.local`
- Verify Azure SQL firewall allows your IP
- Test connection with: `npm run test-sql-connection`

### "Authentication error"
- Check Auth0 environment variables
- Verify `AUTH0_SECRET` is set and correct
- Check Auth0 Dashboard for application configuration

### "Unauthorized"
- User is not logged in
- Session expired
- Auth0 configuration issue

## Getting Help

If the error persists:
1. Check the exact error message in the server logs
2. Verify all environment variables are set
3. Test database connection separately
4. Check Auth0 configuration in the dashboard

