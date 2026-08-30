# Oracle APEX Implementation Checklist

Quick reference checklist for implementing the entire REST API.

---

## Phase 1: Database Setup ⭐⭐⭐⭐⭐

**Priority: CRITICAL - Do this first**

- [ ] Create CREATORS table
- [ ] Create TASKS table
- [ ] Create MANAGERS table
- [ ] Create BRANDS table
- [ ] Create SESSIONS table
- [ ] Create indexes (5 total)
- [ ] Insert default brands (8 total)
- [ ] Insert admin user (username: admin, password: admin)
- [ ] Test queries return data:
  ```sql
  SELECT COUNT(*) FROM creators;
  SELECT COUNT(*) FROM brands;
  ```

**Time:** ~15 minutes

---

## Phase 2: PL/SQL Procedures ⭐⭐⭐⭐⭐

**Priority: CRITICAL - Create all procedures**

### Utility Package
- [ ] Create `content_platform_utils` package
  - [ ] `generate_id()` function
  - [ ] `hash_password()` function
  - [ ] `check_password()` function
  - [ ] `generate_token()` function
  - [ ] `get_user_from_token()` procedure
  - [ ] `json_response()` function
  - [ ] `json_error()` function

### Authentication Procedures
- [ ] `auth_login()` - Login with credentials
- [ ] `auth_logout()` - Clear session
- [ ] `auth_get_session()` - Get current user

### Creator Procedures
- [ ] `creators_list()` - Get all creators
- [ ] `creators_get_by_id()` - Get one creator
- [ ] `creators_get_by_username()` - Get by username
- [ ] `creators_create()` - Create new creator
- [ ] `creators_update()` - Update creator
- [ ] `creators_delete()` - Delete creator

### Task Procedures
- [ ] `tasks_list()` - Get all tasks
- [ ] `tasks_get_by_id()` - Get one task
- [ ] `tasks_list_by_date()` - Get tasks by date
- [ ] `tasks_list_by_creator()` - Get creator's tasks
- [ ] `tasks_create()` - Create new task
- [ ] `tasks_update()` - Update task
- [ ] `tasks_delete()` - Delete task

### Manager Procedures
- [ ] `managers_list()` - Get all managers
- [ ] `managers_get_by_id()` - Get one manager
- [ ] `managers_get_by_username()` - Get by username
- [ ] `managers_create()` - Create new manager
- [ ] `managers_update()` - Update manager
- [ ] `managers_delete()` - Delete manager

### Brand Procedures
- [ ] `brands_list()` - Get all brands
- [ ] `brands_initialize()` - Initialize defaults
- [ ] `brands_add()` - Add new brand
- [ ] `brands_delete()` - Delete brand

**Test Each Procedure:**
```sql
-- Test format
DECLARE
  v_response CLOB;
BEGIN
  auth_login('admin', 'admin', v_response);
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/
```

**Time:** ~45 minutes

---

## Phase 3: REST Module Setup ⭐⭐⭐⭐

**Priority: CRITICAL - Create modules & handlers**

### Module Creation
- [ ] Go to SQL Workshop → RESTful Services
- [ ] Create Module: `content-platform` (prefix: `/content-platform`)
- [ ] Enable "Publish"

### Authentication Templates & Handlers
- [ ] Create Template: `auth`
  - [ ] Handler: POST /auth/login
  - [ ] Handler: POST /auth/logout
  - [ ] Handler: GET /auth/session

### Creator Templates & Handlers
- [ ] Create Template: `creators`
  - [ ] Handler: GET /creators
  - [ ] Handler: POST /creators
- [ ] Create Template: `creators/{id}`
  - [ ] Handler: GET /creators/{id}
  - [ ] Handler: PUT /creators/{id}
  - [ ] Handler: DELETE /creators/{id}
- [ ] Create Template: `creators/username/{username}`
  - [ ] Handler: GET /creators/username/{username}

### Task Templates & Handlers
- [ ] Create Template: `tasks`
  - [ ] Handler: GET /tasks
  - [ ] Handler: POST /tasks
- [ ] Create Template: `tasks/{id}`
  - [ ] Handler: GET /tasks/{id}
  - [ ] Handler: PUT /tasks/{id}
  - [ ] Handler: DELETE /tasks/{id}
- [ ] Create Template: `tasks/date/{date}`
  - [ ] Handler: GET /tasks/date/{date}
- [ ] Create Template: `tasks/creator/{creatorId}`
  - [ ] Handler: GET /tasks/creator/{creatorId}

### Manager Templates & Handlers
- [ ] Create Template: `managers`
  - [ ] Handler: GET /managers
  - [ ] Handler: POST /managers
- [ ] Create Template: `managers/{id}`
  - [ ] Handler: GET /managers/{id}
  - [ ] Handler: PUT /managers/{id}
  - [ ] Handler: DELETE /managers/{id}
- [ ] Create Template: `managers/username/{username}`
  - [ ] Handler: GET /managers/username/{username}

### Brand Templates & Handlers
- [ ] Create Template: `brands`
  - [ ] Handler: GET /brands
  - [ ] Handler: POST /brands
- [ ] Create Template: `brands/initialize`
  - [ ] Handler: POST /brands/initialize
- [ ] Create Template: `brands/{brand}`
  - [ ] Handler: DELETE /brands/{brand}

**Time:** ~60 minutes (tedious but straightforward)

---

## Phase 4: CORS Configuration ⭐⭐⭐

**Priority: HIGH - Required for frontend to work**

- [ ] Go to SQL Workshop → RESTful Services → Access Control
- [ ] Create CORS rule:
  - Pattern: `/content-platform/*`
  - Methods: GET, POST, PUT, DELETE, OPTIONS
  - Origins: 
    - `http://localhost:5173`
    - `http://localhost:5174`
  - Headers: `Content-Type,Authorization`

**Alternative SQL:**
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

**Time:** ~5 minutes

---

## Phase 5: Testing ⭐⭐⭐

**Priority: HIGH - Verify everything works**

### Using Postman

**Test 1: Login**
```
POST http://localhost:8080/ords/workspace/content-platform/api/auth/login
Body: {"username":"admin","password":"admin"}
Expected: token in response ✓
```

**Test 2: Get Creators**
```
GET http://localhost:8080/ords/workspace/content-platform/api/creators
Header: Authorization: Bearer <token>
Expected: Empty array [] ✓
```

**Test 3: Create Creator**
```
POST http://localhost:8080/ords/workspace/content-platform/api/creators
Body: {"name":"Test","username":"test","password":"123","brands":["Nike"]}
Expected: Created creator object with ID ✓
```

**Test 4: Get Creators Again**
```
GET http://localhost:8080/ords/workspace/content-platform/api/creators
Expected: Array with 1 creator ✓
```

**Test 5: Create Task**
```
POST http://localhost:8080/ords/workspace/content-platform/api/tasks
Body: {"creatorId":"creator-xxx","brand":"Nike","scheduledDate":"2024-12-25","scriptLink":"https://...","instruction":"test","notes":""}
Expected: Created task object ✓
```

**Test 6: Get Tasks**
```
GET http://localhost:8080/ords/workspace/content-platform/api/tasks
Expected: Array with 1 task ✓
```

- [ ] Test all 5 endpoints above in Postman
- [ ] All return 200-201 status codes
- [ ] All return valid JSON
- [ ] No 500 errors
- [ ] No CORS errors

**Time:** ~20 minutes

---

## Phase 6: Frontend Configuration ⭐⭐⭐⭐

**Priority: HIGH - Connect frontend to API**

### Environment Configuration
- [ ] Edit `.env.local`:
  ```env
  VITE_REPOSITORY_MODE=api
  VITE_API_BASE_URL=http://localhost:8080/ords/workspace-name/content-platform/api
  ```
  Replace `workspace-name` with your actual workspace name

- [ ] Restart dev server:
  ```bash
  npm run dev
  ```

### Frontend Testing
- [ ] Login with admin/admin
- [ ] Create a creator in the app
- [ ] Verify it appears in APEX database
- [ ] Create a task
- [ ] Verify it appears in APEX database
- [ ] Update task status
- [ ] Verify update in APEX database
- [ ] Delete task
- [ ] Verify deletion in APEX database
- [ ] Test all roles (admin, creator, manager)
- [ ] Test export to Excel
- [ ] Test import from Excel
- [ ] Test 5-minute inactivity logout
- [ ] No console errors
- [ ] No API errors in Network tab

**Time:** ~30 minutes

---

## Phase 7: Production Hardening ⭐⭐⭐

**Priority: MEDIUM - Do before going live**

### Security
- [ ] Implement password hashing (bcrypt/Argon2)
- [ ] Use JWT tokens instead of simple tokens
- [ ] Add input validation server-side
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Add SQL injection prevention (already done via procedures)
- [ ] Add audit logging table

### Performance
- [ ] Verify all indexes exist
- [ ] Test with 1000+ records
- [ ] Add pagination to list endpoints
- [ ] Consider caching for brands list
- [ ] Monitor query performance

### Error Handling
- [ ] All endpoints return proper HTTP status codes
- [ ] Error messages are user-friendly
- [ ] No sensitive data in error messages
- [ ] Errors logged to error_logs table

### Documentation
- [ ] Document your APEX workspace
- [ ] Document API changes from defaults
- [ ] Create runbooks for ops team
- [ ] Document backup procedures

**Time:** ~120 minutes (ongoing)

---

## Quick Command Reference

### Create Database Schema
```bash
# Run this in SQL Developer as admin/oracle user
@APEX_PLSQL_SCRIPTS.md  (copy SQL sections)
```

### Verify Procedures Exist
```sql
SELECT object_name, object_type 
FROM user_objects 
WHERE object_type = 'PROCEDURE' 
AND object_name LIKE '%CREATOR%';
```

### Test Procedure
```sql
DECLARE v_response CLOB;
BEGIN
  creators_list(v_response);
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/
```

### Get REST Module URL
```
http://localhost:8080/ords/workspace-name/content-platform/api/creators
```

### Clear Sessions Table
```sql
DELETE FROM sessions;
COMMIT;
```

### Find APEX URL
1. Login to APEX
2. Look at browser URL
3. Format: `http://host:port/ords/workspace/`

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Procedures not found | Check they're in correct schema; grant EXECUTE to APEX_PUBLIC_USER |
| 404 errors | Verify REST module path and handler names |
| CORS errors | Check CORS configuration in APEX |
| JSON errors | Verify apex_json syntax; check v_body not NULL |
| Auth failures | Check users table; verify password field |
| Token issues | Check sessions table for expired tokens |
| Database errors | Check procedures logic; run test script |

---

## Estimated Total Time

| Phase | Time | Notes |
|-------|------|-------|
| Database Setup | 15 min | Straightforward SQL |
| PL/SQL Procedures | 45 min | Copy-paste from guide |
| REST Modules | 60 min | Repetitive clicking in APEX UI |
| CORS Config | 5 min | One SQL block |
| Testing | 20 min | Verify in Postman |
| Frontend Config | 30 min | Change env var, restart, test |
| **TOTAL** | **~175 min** | **~3 hours** |

---

## Success Criteria

✅ All database tables created  
✅ All 25+ procedures created and tested  
✅ All 30+ REST endpoints created  
✅ CORS configured correctly  
✅ Each endpoint tested in Postman  
✅ Frontend configured for API mode  
✅ Full flow tested (login → CRUD → persist)  
✅ No console errors  
✅ No 5xx errors in API responses  
✅ Data appears in APEX database  

---

## Deployment Checklist

Before moving to production:

- [ ] Database backups configured
- [ ] Passwords hashed
- [ ] HTTPS enabled
- [ ] APEX URL points to prod instance
- [ ] Frontend `.env.prod` configured with prod API URL
- [ ] Rate limiting enabled
- [ ] Error logging enabled
- [ ] Audit logging enabled
- [ ] CORS updated to prod domains
- [ ] Test full flow end-to-end
- [ ] Rollback procedure documented
- [ ] Ops team trained

---

## References

- **Schema:** APEX_PLSQL_SCRIPTS.md (Database section)
- **PL/SQL:** APEX_PLSQL_SCRIPTS.md (Procedures section)
- **REST Setup:** APEX_REST_MODULE_SETUP.md (Step-by-step)
- **Endpoints:** APEX_ENDPOINT_REFERENCE.md (Request/response)
- **Integration:** APEX_INTEGRATION_GUIDE.md (Full guide)

---

**Last Updated:** 2024-08-29  
**Status:** Ready to implement  
**Questions?** Check the full guide documents above
