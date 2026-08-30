# Login Test - Quick Start Guide

## 🎯 Objective

Test if your React application can successfully authenticate with your Oracle APEX REST API.

---

## ⚡ Quick Test (2 minutes)

### Step 1: Start the Dev Server

```bash
npm run dev
```

Expected output:
```
VITE v8.2.2  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 2: Open Login Test Page

Open in your browser:
```
http://localhost:5173/test-login
```

### Step 3: Run the Test

1. **Default credentials are already filled:**
   - Username: `admin`
   - Password: `admin`

2. **Click: "Test Login"**

3. **Review the results:**
   - ✅ Green checks = Success
   - ❌ Red X = Failure
   - ⏳ Spinning loader = In progress

---

## 📊 What the Test Checks

### Step 1: API Configuration ✓
- Verifies the API URL is configured correctly
- Expected: `https://oracleapex.com/ords/expplayground/platform/api`

### Step 2: Network Connectivity ✓
- Tests if the server is reachable
- Checks response from server
- Measures latency (should be < 500ms)

### Step 3: Login Request ✓
- Sends `POST /auth/login` with credentials
- Expects: `200 OK` response with token
- Extracts and stores the authentication token

### Step 4: Verify Token ✓
- Sends `GET /auth/session` with the received token
- Verifies the token is valid
- Confirms user session is established

---

## ✅ Success Criteria

All 4 steps should show **Green ✓** if everything is working:

```
✓ 1. API Configuration (success)
✓ 2. Network Connectivity (success) - XXXms
✓ 3. Login Request (success) - XXXms
✓ 4. Verify Token (success) - XXXms
```

If you see this, your **React app and Oracle APEX are communicating!** 🎉

---

## ❌ If Login Fails

### Common Issues & Fixes

#### Issue: "Connection failed: Network error"
**Cause:** Server is unreachable

**Fix:**
1. Check if Oracle APEX instance is running
2. Verify the URL is correct: `https://oracleapex.com/ords/expplayground/platform/api`
3. Check firewall allows outbound HTTPS
4. Try accessing APEX directly in browser

#### Issue: "Login failed: 404 Not Found"
**Cause:** Endpoint doesn't exist

**Fix:**
1. Verify REST module exists in APEX: "Content Platform API"
2. Check module is published (checkbox is checked)
3. Verify template "/auth/login" exists
4. Verify POST handler is created for /auth/login

#### Issue: "Login failed: 403 Forbidden"
**Cause:** CORS not configured properly

**Fix:**
1. Go to APEX: SQL Workshop → RESTful Services → Access Control
2. Add CORS rule:
   - Pattern: `/platform/api/*`
   - Origins: `http://localhost:5173`
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   - Headers: Content-Type, Authorization

#### Issue: "Login failed: Invalid username or password"
**Cause:** Wrong credentials or user doesn't exist

**Fix:**
1. Check admin user exists in database:
   ```sql
   SELECT * FROM creators WHERE username='admin';
   ```
2. Verify password is: `admin`
3. Check auth_login procedure exists
4. Test procedure directly in SQL:
   ```sql
   DECLARE v_response CLOB;
   BEGIN
     auth_login('admin', 'admin', v_response);
     DBMS_OUTPUT.PUT_LINE(v_response);
   END;
   /
   ```

#### Issue: "Step 4: Token verification failed"
**Cause:** Token format or session issue

**Fix:**
1. Verify auth_get_session procedure exists
2. Check SESSIONS table has the token
3. Verify token hasn't expired
4. Check procedure syntax

---

## 🔍 Debug with Browser DevTools

### Open DevTools: Press `F12`

### Network Tab
1. Click "Test Login" button
2. Look for requests to:
   - `https://oracleapex.com/ords/expplayground/platform/api/auth/login`
   - `https://oracleapex.com/ords/expplayground/platform/api/auth/session`

3. Click each request and check:
   - **Status Code:** Should be 200
   - **Request Headers:** Check `Content-Type: application/json`
   - **Response Headers:** Check CORS headers present
   - **Response Body:** Check JSON has `user` and `token`

### Console Tab
Look for any error messages:
- CORS errors → Configure CORS in APEX
- Network errors → Server unreachable
- Parse errors → Invalid JSON response

---

## 🔐 What Happens After Successful Login

1. **Token is stored** in browser's localStorage under key: `authToken`
2. **Token is used** for all subsequent API requests
3. **Token is sent** in Authorization header: `Bearer <token>`
4. **Session is verified** with each authenticated request

---

## 📝 Manual Test with cURL

If you want to test without the UI:

```bash
# Test login
curl -X POST https://oracleapex.com/ords/expplayground/platform/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Expected response:
```json
{
  "user": {
    "id": "admin",
    "username": "admin",
    "name": "Admin",
    "role": "admin"
  },
  "token": "token-20240830123000-ABC123"
}
```

---

## 🎓 Understanding the Test Flow

```
┌─────────────────────────────────────────────────────┐
│  React App (http://localhost:5173)                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1. Check API Config
                   ├────────────────────────────────────┐
                   │                                    │
                   │ 2. Test Connectivity (HEAD/OPTIONS)│
                   ├────────────────────────────────────┤
                   │                                    │
                   │ 3. POST /auth/login                │
                   │    + Credentials (admin/admin)     │
                   │                                    │
                   ▼                                    │
┌─────────────────────────────────────────────────────┐
│  Oracle APEX                                        │
│  Module: Content Platform API                       │
│  Template: /auth/login (POST)                       │
│                                                     │
│  ┌──────────────────────────────────┐              │
│  │ Handler Procedure:               │              │
│  │ auth_login(                       │              │
│  │   p_username VARCHAR2,            │              │
│  │   p_password VARCHAR2,            │              │
│  │   p_response OUT CLOB             │              │
│  │ )                                 │              │
│  └──────────────────────────────────┘              │
│                                                     │
│  Returns: {user: {...}, token: "..."}              │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Response with token
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  React App stores token in localStorage             │
│  Step 4: Verify token with GET /auth/session        │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Next Steps After Login Test Passes

Once login test shows ✓ for all 4 steps:

1. **Test full CRUD operations:**
   - Go to: `http://localhost:5173/diagnostics`
   - Click: "Run API Tests"

2. **Enable API mode in React:**
   - Update `.env.local`:
     ```env
     VITE_REPOSITORY_MODE=api
     VITE_API_BASE_URL=https://oracleapex.com/ords/expplayground/platform/api
     ```
   - Restart dev server: `npm run dev`

3. **Test the full application:**
   - Login with admin/admin
   - Create creators, tasks, managers
   - Verify data persists in Oracle APEX

---

## 📞 Getting Help

If the login test fails:

1. **Check the specific error message** displayed in the test results
2. **Click "View Details"** to see full error data
3. **Open DevTools (F12)** and check Network tab
4. **Review the specific fix** for your error above
5. **Check Oracle APEX logs** for procedure errors

---

## 🚀 TL;DR - Super Quick

1. `npm run dev`
2. Open: `http://localhost:5173/test-login`
3. Click: "Test Login"
4. If all green ✓ → **Success!**
5. If red ❌ → Check error message and troubleshooting above

---

**Created:** 2024-08-30  
**Status:** Ready to test  
**Time to complete:** ~2 minutes  
