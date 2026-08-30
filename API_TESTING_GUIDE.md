# API Testing Guide - Oracle APEX Integration

Complete guide to testing your Oracle APEX REST API integration with the React application.

## Quick Start

### Step 1: Access the Diagnostic Tool

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open browser: `http://localhost:5173/diagnostics`

3. Click **"Run API Tests"** button

4. Review results and troubleshoot any failures

### Step 2: Manual Testing with Postman

1. Open Postman
2. Create new collection: "Content Platform API"
3. Set base URL: `https://oracleapex.com/ords/expplayground/platform/api`
4. Follow test sequences below

---

## Automated Testing (Diagnostic Tool)

The diagnostic tool runs the following tests automatically:

### Test 1: API Connectivity ✓
- **What:** Checks if the API server is reachable
- **Expected:** HTTP 200 or successful response
- **If Failed:** 
  - Verify Oracle APEX instance is running
  - Check firewall allows outbound to oracleapex.com
  - Verify API URL in `api-client.ts` is correct

### Test 2: Login ✓
- **What:** Tests authentication with admin credentials
- **Expected:** Returns user object + token
- **If Failed:**
  - Check admin user exists in CREATORS table
  - Verify password matches: admin/admin
  - Check `auth_login` procedure exists
  - Verify APEX error logs

### Test 3: Get Creators ✓
- **What:** Lists all creators (requires auth)
- **Expected:** Returns array of creators
- **If Failed:**
  - Verify token is being sent in Authorization header
  - Check CREATORS table exists and has data
  - Verify `creators_list` procedure exists
  - Check APEX REST module permissions

### Test 4: Create Creator ✓
- **What:** Creates a new test creator
- **Expected:** Returns created creator object with ID
- **If Failed:**
  - Verify `creators_create` procedure exists
  - Check POST handler is configured
  - Verify database write permissions
  - Check for duplicate username errors

### Test 5: Get Brands ✓
- **What:** Lists all available brands
- **Expected:** Returns array of brand names
- **If Failed:**
  - Verify BRANDS table exists
  - Check `brands_list` procedure
  - Ensure default brands were inserted

### Test 6: Logout ✓
- **What:** Clears session token
- **Expected:** Success message
- **If Failed:**
  - Check `auth_logout` procedure
  - Verify SESSIONS table exists
  - Check token cleanup logic

---

## Manual Testing with Postman

### Setup Postman

1. **Create Environment Variable:**
   - Key: `api_url`
   - Value: `https://oracleapex.com/ords/expplayground/platform/api`
   - Key: `token`
   - Value: (will be filled by first request)

2. **Create Pre-request Script** (for token management):
   ```javascript
   // Auto-set token from login response
   if (pm.globals.has("authToken")) {
     pm.request.headers.add({
       key: "Authorization",
       value: "Bearer " + pm.globals.get("authToken")
     });
   }
   ```

3. **Create Tests** (for validation):
   ```javascript
   pm.test("Status is 200 or 201", function () {
     pm.expect(pm.response.code).to.be.oneOf([200, 201]);
   });
   ```

---

## Test Sequences

### Sequence 1: Authentication Flow ⭐⭐⭐

**Step 1: Login**
```
POST {{api_url}}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

Expected Response (200):
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

Save token for next requests:
```javascript
pm.globals.set("authToken", pm.response.json().token);
```

**Step 2: Get Session**
```
GET {{api_url}}/auth/session
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
{
  "id": "admin",
  "username": "admin",
  "name": "Admin",
  "role": "admin"
}
```

**Step 3: Logout**
```
POST {{api_url}}/auth/logout
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### Sequence 2: Creator CRUD ⭐⭐⭐

**Prerequisites:** Run Sequence 1 (Login)

**Step 1: Create Creator**
```
POST {{api_url}}/creators
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "name": "John Doe",
  "username": "johndoe",
  "password": "password123",
  "brands": ["Nike", "Adidas"],
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

Expected Response (201):
```json
{
  "id": "creator-123",
  "name": "John Doe",
  "username": "johndoe",
  "password": "password123",
  "brands": ["Nike", "Adidas"],
  "status": "active",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-08-30T12:30:00Z",
  "updatedAt": "2024-08-30T12:30:00Z"
}
```

Save ID for next requests:
```javascript
pm.globals.set("creatorId", pm.response.json().id);
```

**Step 2: Get All Creators**
```
GET {{api_url}}/creators
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
[
  {
    "id": "creator-123",
    "name": "John Doe",
    ...
  },
  ...
]
```

**Step 3: Get Creator by ID**
```
GET {{api_url}}/creators/{{creatorId}}
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
{
  "id": "creator-123",
  "name": "John Doe",
  ...
}
```

**Step 4: Get Creator by Username**
```
GET {{api_url}}/creators/username/johndoe
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
{
  "id": "creator-123",
  "name": "John Doe",
  ...
}
```

**Step 5: Update Creator**
```
PUT {{api_url}}/creators/{{creatorId}}
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "name": "John Doe Updated",
  "brands": ["Nike", "Adidas", "Puma"]
}
```

Expected Response (200):
```json
{
  "id": "creator-123",
  "name": "John Doe Updated",
  "brands": ["Nike", "Adidas", "Puma"],
  ...
}
```

**Step 6: Delete Creator**
```
DELETE {{api_url}}/creators/{{creatorId}}
Authorization: Bearer {{authToken}}
```

Expected Response (204 No Content or 200):
```
[no body]
```

---

### Sequence 3: Task CRUD ⭐⭐⭐

**Prerequisites:** Run Sequence 1 (Login) and Sequence 2 Step 1 (Create Creator)

**Step 1: Create Task**
```
POST {{api_url}}/tasks
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "creatorId": "{{creatorId}}",
  "brand": "Nike",
  "scheduledDate": "2024-12-25",
  "scriptLink": "https://script.example.com",
  "instruction": "Film product review",
  "notes": "Include unboxing",
  "referenceLink": "https://reference.example.com",
  "status": "not-started"
}
```

Expected Response (201):
```json
{
  "id": "task-123",
  "creatorId": "creator-123",
  "brand": "Nike",
  "scheduledDate": "2024-12-25",
  "scriptLink": "https://script.example.com",
  "instruction": "Film product review",
  "notes": "Include unboxing",
  "referenceLink": "https://reference.example.com",
  "status": "not-started",
  "createdAt": "2024-08-30T12:30:00Z",
  "updatedAt": "2024-08-30T12:30:00Z"
}
```

Save task ID:
```javascript
pm.globals.set("taskId", pm.response.json().id);
```

**Step 2: Get All Tasks**
```
GET {{api_url}}/tasks
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
[
  {
    "id": "task-123",
    "creatorId": "creator-123",
    ...
  }
]
```

**Step 3: Get Task by ID**
```
GET {{api_url}}/tasks/{{taskId}}
Authorization: Bearer {{authToken}}
```

**Step 4: Get Tasks by Date**
```
GET {{api_url}}/tasks/date/2024-12-25
Authorization: Bearer {{authToken}}
```

**Step 5: Get Tasks by Creator**
```
GET {{api_url}}/tasks/creator/{{creatorId}}
Authorization: Bearer {{authToken}}
```

**Step 6: Update Task Status**
```
PUT {{api_url}}/tasks/{{taskId}}
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "status": "completed",
  "notes": "Completed successfully"
}
```

**Step 7: Delete Task**
```
DELETE {{api_url}}/tasks/{{taskId}}
Authorization: Bearer {{authToken}}
```

---

### Sequence 4: Brands Management ⭐⭐

**Step 1: Get All Brands**
```
GET {{api_url}}/brands
Authorization: Bearer {{authToken}}
```

Expected Response (200):
```json
[
  "Nike",
  "Adidas",
  "Puma",
  ...
]
```

**Step 2: Add New Brand**
```
POST {{api_url}}/brands
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "brand": "Salomon"
}
```

Expected Response (201):
```json
{
  "message": "Brand added",
  "brand": "Salomon"
}
```

**Step 3: Delete Brand**
```
DELETE {{api_url}}/brands/Salomon
Authorization: Bearer {{authToken}}
```

Expected Response (204 No Content):
```
[no body]
```

---

### Sequence 5: Manager CRUD ⭐

**Step 1: Create Manager**
```
POST {{api_url}}/managers
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "name": "Manager Name",
  "username": "manager",
  "password": "password123",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Step 2: Get All Managers**
```
GET {{api_url}}/managers
Authorization: Bearer {{authToken}}
```

**Step 3: Get Manager by ID/Username**
```
GET {{api_url}}/managers/{{managerId}}
GET {{api_url}}/managers/username/manager
Authorization: Bearer {{authToken}}
```

**Step 4: Update Manager**
```
PUT {{api_url}}/managers/{{managerId}}
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

**Step 5: Delete Manager**
```
DELETE {{api_url}}/managers/{{managerId}}
Authorization: Bearer {{authToken}}
```

---

## Common Issues & Solutions

### Issue: 403 Forbidden

**Symptoms:**
- All endpoints return 403
- Error in browser console

**Solutions:**
1. Check CORS configuration in Oracle APEX:
   ```sql
   SELECT * FROM apex_rest_cors_access_control;
   ```

2. Verify frontend origin is in allowed list:
   - Add `http://localhost:5173` and `http://localhost:5174`

3. Ensure Access-Control headers are set:
   - Allow-Origin: Your domain
   - Allow-Methods: GET, POST, PUT, DELETE
   - Allow-Headers: Content-Type, Authorization

### Issue: 401 Unauthorized

**Symptoms:**
- Login works but other endpoints fail
- Token not being sent

**Solutions:**
1. Verify token is in `localStorage.authToken`
2. Check Authorization header is being sent:
   - Open DevTools → Network tab
   - Look for `Authorization: Bearer <token>` header
3. Verify token format matches APEX expectations
4. Check token expiration time in SESSIONS table

### Issue: 404 Not Found

**Symptoms:**
- Endpoints return 404
- Wrong API URL

**Solutions:**
1. Verify API URL in `api-client.ts`:
   ```typescript
   const API_BASE_URL = "https://oracleapex.com/ords/expplayground/platform/api";
   ```

2. Check REST module path in APEX:
   - Module: `content-platform`
   - Base path: `/content-platform`

3. Verify template names match endpoints:
   - `/auth` → `/auth/login`, `/auth/logout`, `/auth/session`
   - `/creators` → `/creators`, `/creators/{id}`, etc.

### Issue: 500 Server Error

**Symptoms:**
- Database errors returned
- Procedure errors

**Solutions:**
1. Check procedures exist in Oracle:
   ```sql
   SELECT object_name FROM user_objects 
   WHERE object_type = 'PROCEDURE' 
   AND object_name LIKE '%CREATOR%';
   ```

2. Check procedure parameters match request body:
   ```sql
   SELECT argument_name, data_type FROM user_arguments 
   WHERE object_name = 'CREATORS_CREATE';
   ```

3. Check database tables exist:
   ```sql
   SELECT table_name FROM user_tables 
   WHERE table_name IN ('CREATORS', 'TASKS', 'MANAGERS', 'BRANDS');
   ```

4. Review APEX error logs

---

## Performance Testing

### Load Test Sample

Create a Postman collection runner:

1. **Setup:**
   - 10 iterations
   - 100ms delay between requests

2. **Requests:**
   - Login (1x)
   - Create Creator (5x) - unique usernames
   - Get Creators (3x)
   - Logout (1x)

3. **Metrics:**
   - Average response time should be < 500ms
   - No timeouts or connection errors
   - Success rate 100%

### Optimize if Slow

1. Add database indexes:
   ```sql
   CREATE INDEX idx_creators_username ON creators(username);
   ```

2. Implement pagination in list endpoints

3. Add query result caching

---

## Validation Checklist

Before considering API ready for production:

- [ ] All 6 automated tests pass
- [ ] All manual test sequences work
- [ ] Creators CRUD works end-to-end
- [ ] Tasks CRUD works with date filtering
- [ ] Managers CRUD works
- [ ] Brands management works
- [ ] Authentication flow is secure
- [ ] CORS configured correctly
- [ ] Error messages are clear
- [ ] Response times acceptable (< 500ms)
- [ ] No SQL injection vulnerabilities
- [ ] Tokens expire properly
- [ ] Sessions cleaned up on logout
- [ ] Export/Import functions work
- [ ] Frontend app authenticates correctly
- [ ] Full flow tested: Login → CRUD → Persist

---

## Browser DevTools Inspection

### Network Tab Analysis

1. Open DevTools (F12) → Network tab
2. Run test in diagnostic tool
3. For each request, check:
   - ✓ Status code (200, 201, 400, 401, 404, 500)
   - ✓ Request headers (Content-Type, Authorization)
   - ✓ Response headers (CORS headers present)
   - ✓ Request/Response body (JSON valid)
   - ✓ Response time (< 500ms ideal)

### Console Tab Analysis

Look for:
- ✗ CORS errors → Check APEX CORS config
- ✗ TypeError → Check response format
- ✗ Network errors → Check server reachable
- ✓ Test logs → Success messages

### Application Tab Analysis

Check localStorage:
- `authToken` - Should contain valid token after login
- `session` - Should contain user data

---

## Resources

- **Diagnostic Tool:** http://localhost:5173/diagnostics
- **PL/SQL Scripts:** APEX_PLSQL_SCRIPTS.md
- **Endpoint Specs:** APEX_ENDPOINT_REFERENCE.md
- **Setup Guide:** APEX_REST_MODULE_SETUP.md
- **Integration Guide:** APEX_INTEGRATION_GUIDE.md

---

**Last Updated:** 2024-08-30  
**Status:** Complete and ready to test
