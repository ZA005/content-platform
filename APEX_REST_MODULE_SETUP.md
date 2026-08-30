# Oracle APEX REST Module Setup Guide

Complete step-by-step guide to set up REST modules in Oracle APEX and connect them to the PL/SQL procedures.

## Prerequisites

- Oracle APEX 21.1+ (or 22.x, 23.x)
- SQL Developer or SQL*Plus access
- The PL/SQL procedures already created (from APEX_PLSQL_SCRIPTS.md)

## Step 1: Access APEX Administration

1. Log into your Oracle APEX workspace
2. Go to **SQL Workshop** → **RESTful Services**
3. Click **Create Module**

## Step 2: Create Base Module

**Module Properties:**
- **URI Prefix:** `content-platform`
- **Module Name:** `Content Platform API`
- **Publish:** Enable

Click **Create Module**

## Step 3: Set Up Authentication (Optional but Recommended)

In the Module details:
- **Protected By:** Oracle Application Express Users
  - OR create custom authentication logic

This ensures only authenticated users can access REST endpoints.

---

## Step 4: Create Templates and Handlers

### 4.1 Authentication Template

**Create Template:**
- Template URI: `auth`
- Click **Create Template**

### 4.1.1 POST /auth/login Handler

**In the `/auth` template:**
1. Click **Create Handler**
2. Set up:
   - **HTTP Method:** POST
   - **Source Type:** PL/SQL
   - **Source:**

```sql
DECLARE
  v_response CLOB;
  v_body CLOB := :body;
  v_username VARCHAR2(255);
  v_password VARCHAR2(255);
BEGIN
  -- Parse JSON body
  v_username := apex_json.get_varchar2(v_body, 'username');
  v_password := apex_json.get_varchar2(v_body, 'password');
  
  -- Call procedure
  auth_login(
    p_username => v_username,
    p_password => v_password,
    p_response => v_response
  );
  
  -- Set response headers
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

3. Click **Create Handler**

### 4.1.2 POST /auth/logout Handler

**In the `/auth` template:**
1. Click **Create Handler**
2. Set up:
   - **HTTP Method:** POST
   - **Source Type:** PL/SQL
   - **Source:**

```sql
DECLARE
  v_response CLOB;
  v_token VARCHAR2(255) := HTP.get_cgi_env('HTTP_AUTHORIZATION');
BEGIN
  -- Remove "Bearer " prefix
  v_token := SUBSTR(v_token, 8);
  
  auth_logout(
    p_token => v_token,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

3. Click **Create Handler**

### 4.1.3 GET /auth/session Handler

**In the `/auth` template:**
1. Click **Create Handler**
2. Set up:
   - **HTTP Method:** GET
   - **Source Type:** PL/SQL
   - **Source:**

```sql
DECLARE
  v_response CLOB;
  v_token VARCHAR2(255) := HTP.get_cgi_env('HTTP_AUTHORIZATION');
BEGIN
  -- Remove "Bearer " prefix
  v_token := SUBSTR(v_token, 8);
  
  auth_get_session(
    p_token => v_token,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

3. Click **Create Handler**

---

### 4.2 Creators Template

**Create Template:**
- Template URI: `creators`
- Click **Create Template**

### 4.2.1 GET /creators Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  creators_list(v_response);
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### 4.2.2 POST /creators Handler

```sql
DECLARE
  v_response CLOB;
  v_body CLOB := :body;
BEGIN
  creators_create(
    p_name => apex_json.get_varchar2(v_body, 'name'),
    p_username => apex_json.get_varchar2(v_body, 'username'),
    p_password => apex_json.get_varchar2(v_body, 'password'),
    p_brands => apex_json.get_clob(v_body, 'brands'),
    p_avatar_url => apex_json.get_varchar2(v_body, 'avatarUrl'),
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.3 Creator by ID Template

**Create Template:**
- Template URI: `creators/{id}`
- Click **Create Template**

### 4.3.1 GET /creators/{id} Handler

```sql
DECLARE
  v_response CLOB;
  v_id VARCHAR2(100) := :id;
BEGIN
  creators_get_by_id(
    p_id => v_id,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### 4.3.2 PUT /creators/{id} Handler

```sql
DECLARE
  v_response CLOB;
  v_body CLOB := :body;
  v_id VARCHAR2(100) := :id;
BEGIN
  creators_update(
    p_id => v_id,
    p_name => apex_json.get_varchar2(v_body, 'name'),
    p_username => apex_json.get_varchar2(v_body, 'username'),
    p_password => apex_json.get_varchar2(v_body, 'password'),
    p_brands => apex_json.get_clob(v_body, 'brands'),
    p_status => apex_json.get_varchar2(v_body, 'status'),
    p_avatar_url => apex_json.get_varchar2(v_body, 'avatarUrl'),
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### 4.3.3 DELETE /creators/{id} Handler

```sql
DECLARE
  v_response CLOB;
  v_id VARCHAR2(100) := :id;
BEGIN
  creators_delete(
    p_id => v_id,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.4 Creator by Username Template

**Create Template:**
- Template URI: `creators/username/{username}`
- Click **Create Template**

### GET /creators/username/{username} Handler

```sql
DECLARE
  v_response CLOB;
  v_username VARCHAR2(100) := :username;
BEGIN
  creators_get_by_username(
    p_username => v_username,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.5 Tasks Template

**Create Template:**
- Template URI: `tasks`
- Click **Create Template**

### 4.5.1 GET /tasks Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  tasks_list(v_response);
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### 4.5.2 POST /tasks Handler

```sql
DECLARE
  v_response CLOB;
  v_body CLOB := :body;
BEGIN
  tasks_create(
    p_creator_id => apex_json.get_varchar2(v_body, 'creatorId'),
    p_brand => apex_json.get_varchar2(v_body, 'brand'),
    p_scheduled_date => apex_json.get_varchar2(v_body, 'scheduledDate'),
    p_script_link => apex_json.get_varchar2(v_body, 'scriptLink'),
    p_instruction => apex_json.get_clob(v_body, 'instruction'),
    p_notes => apex_json.get_clob(v_body, 'notes'),
    p_reference_link => apex_json.get_varchar2(v_body, 'referenceLink'),
    p_status => apex_json.get_varchar2(v_body, 'status'),
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.6 Task by ID Template

**Create Template:**
- Template URI: `tasks/{id}`

### GET /tasks/{id} Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  tasks_get_by_id(
    p_id => :id,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### PUT /tasks/{id} Handler

```sql
DECLARE
  v_response CLOB;
  v_body CLOB := :body;
BEGIN
  tasks_update(
    p_id => :id,
    p_creator_id => apex_json.get_varchar2(v_body, 'creatorId'),
    p_brand => apex_json.get_varchar2(v_body, 'brand'),
    p_scheduled_date => apex_json.get_varchar2(v_body, 'scheduledDate'),
    p_script_link => apex_json.get_varchar2(v_body, 'scriptLink'),
    p_instruction => apex_json.get_clob(v_body, 'instruction'),
    p_notes => apex_json.get_clob(v_body, 'notes'),
    p_reference_link => apex_json.get_varchar2(v_body, 'referenceLink'),
    p_status => apex_json.get_varchar2(v_body, 'status'),
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### DELETE /tasks/{id} Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  tasks_delete(
    p_id => :id,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.7 Tasks by Date Template

**Create Template:**
- Template URI: `tasks/date/{date}`

### GET /tasks/date/{date} Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  tasks_list_by_date(
    p_date => :date,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.8 Tasks by Creator Template

**Create Template:**
- Template URI: `tasks/creator/{creatorId}`

### GET /tasks/creator/{creatorId} Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  tasks_list_by_creator(
    p_creator_id => :creatorId,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.9 Managers Templates

Repeat the same pattern for:
- **Template:** `managers` (GET all, POST create)
- **Template:** `managers/{id}` (GET, PUT, DELETE)
- **Template:** `managers/username/{username}` (GET)

Use these handler stubs:

```sql
-- GET /managers
managers_list(v_response);

-- POST /managers
managers_create(
  p_name => apex_json.get_varchar2(v_body, 'name'),
  p_username => apex_json.get_varchar2(v_body, 'username'),
  p_password => apex_json.get_varchar2(v_body, 'password'),
  p_avatar_url => apex_json.get_varchar2(v_body, 'avatarUrl'),
  p_response => v_response
);

-- GET /managers/{id}
managers_get_by_id(p_id => :id, p_response => v_response);

-- PUT /managers/{id}
managers_update(
  p_id => :id,
  p_name => apex_json.get_varchar2(v_body, 'name'),
  p_username => apex_json.get_varchar2(v_body, 'username'),
  p_password => apex_json.get_varchar2(v_body, 'password'),
  p_avatar_url => apex_json.get_varchar2(v_body, 'avatarUrl'),
  p_response => v_response
);

-- DELETE /managers/{id}
managers_delete(p_id => :id, p_response => v_response);

-- GET /managers/username/{username}
managers_get_by_username(p_username => :username, p_response => v_response);
```

---

### 4.10 Brands Templates

**Create Template:**
- Template URI: `brands`

### GET /brands Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  brands_list(v_response);
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

### POST /brands (Add Brand) Handler

```sql
DECLARE
  v_response CLOB;
  v_body CLOB := :body;
BEGIN
  brands_add(
    p_brand => apex_json.get_varchar2(v_body, 'brand'),
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.11 Brands Initialize Template

**Create Template:**
- Template URI: `brands/initialize`

### POST /brands/initialize Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  brands_initialize(v_response);
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

### 4.12 Brand by Name Template

**Create Template:**
- Template URI: `brands/{brand}`

### DELETE /brands/{brand} Handler

```sql
DECLARE
  v_response CLOB;
BEGIN
  brands_delete(
    p_brand => :brand,
    p_response => v_response
  );
  
  owa_util.mime_header('application/json', FALSE);
  HTP.print(v_response);
EXCEPTION
  WHEN OTHERS THEN
    owa_util.mime_header('application/json', FALSE);
    HTP.print(content_platform_utils.json_error(SQLERRM, 'ERROR'));
END;
/
```

---

## Step 5: Configure CORS (Important!)

CORS is needed for the React frontend to make API calls.

### In SQL Workshop → RESTful Services:

1. Go to **RESTful Services** → **Access Control**
2. Click **Create**
3. Configure:
   - **Pattern:** `/content-platform/*`
   - **Method:** Allow all
   - **Source:** Your frontend URL(s)
     - Local dev: `http://localhost:5173`
     - Local dev: `http://localhost:5174`
   - **Headers to Allow:** `Content-Type,Authorization`

Or via SQL (run in SQL Developer):

```sql
BEGIN
  APEX_CORS.add_access_control(
    p_pattern => '/content-platform/*',
    p_allowed_methods => 'GET,POST,PUT,DELETE,OPTIONS',
    p_allowed_origins => 'http://localhost:5173,http://localhost:5174',
    p_allowed_headers => 'Content-Type,Authorization'
  );
  COMMIT;
END;
/
```

---

## Step 6: Test the Endpoints

Use **Postman** or **curl** to test:

### Test Login

```bash
curl -X POST http://localhost:8080/ords/workspace/content-platform/api/auth/login \
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
  "token": "token-20240829103000-ABC123"
}
```

### Test Create Creator

```bash
curl -X POST http://localhost:8080/ords/workspace/content-platform/api/creators \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "john",
    "password": "password123",
    "brands": ["Nike","Adidas"],
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

### Test Get Creators

```bash
curl -X GET http://localhost:8080/ords/workspace/content-platform/api/creators \
  -H "Authorization: Bearer token-20240829103000-ABC123"
```

---

## Step 7: Enable in React App

Once all endpoints are tested:

1. Update `.env.local`:
   ```env
   VITE_REPOSITORY_MODE=api
   VITE_API_BASE_URL=http://localhost:8080/ords/workspace-name/content-platform/api
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Test the full flow:
   - Login with APEX credentials
   - Create/edit/delete creators, tasks, managers
   - Verify data persists

---

## Troubleshooting

### 401 Unauthorized

- Check token is being sent in `Authorization: Bearer <token>` header
- Verify token hasn't expired in SESSIONS table
- Check APEX authentication settings

### 404 Not Found

- Verify REST module path is correct
- Check template names match URLs
- Ensure handlers are published

### CORS Errors

- Check CORS configuration in APEX
- Verify frontend origin is in allowed list
- Check browser console for specific error

### JSON Parsing Errors

- Use `apex_json` functions correctly
- Verify JSON structure matches procedure parameters
- Check `v_body` is not NULL

### Database Errors

- Check procedures exist: `SELECT * FROM user_procedures WHERE object_name LIKE '%CREATORS%'`
- Verify tables exist: `SELECT * FROM user_tables WHERE table_name LIKE 'CREATORS'`
- Check procedure privileges: `GRANT EXECUTE ON creators_list TO APEX_PUBLIC_USER;`

---

## Performance Tips

1. **Add Indexes** (already in schema creation script):
   ```sql
   CREATE INDEX idx_creators_username ON creators(username);
   CREATE INDEX idx_tasks_creator_date ON tasks(creator_id, scheduled_date);
   ```

2. **Enable Compression** for large responses:
   ```sql
   HTP.init;
   HTP.p('Content-Encoding: gzip');
   ```

3. **Cache Frequently Accessed Data**:
   ```sql
   apex_util.set_session_state('BRANDS_CACHE', v_brands);
   ```

4. **Paginate Large Result Sets**:
   Add `LIMIT` and `OFFSET` parameters to list procedures.

---

## Security Checklist

- [ ] Hash passwords using bcrypt/Argon2
- [ ] Validate all inputs server-side
- [ ] Use parameterized queries (already done with procedures)
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Add audit logging for sensitive operations
- [ ] Set appropriate session timeouts
- [ ] Use strong tokens (JWT or similar)
- [ ] Enable SQL injection prevention
- [ ] Regular security audits

---

## Next Steps

1. Set up database schema from `APEX_PLSQL_SCRIPTS.md`
2. Create PL/SQL procedures
3. Follow this guide to create REST modules
4. Test each endpoint with Postman
5. Update frontend `.env.local` to use API mode
6. Restart dev server and test full flow
7. Deploy to production with proper security

