# Oracle APEX Integration - Quick Start

## 🚀 Current Status
✅ API infrastructure implemented with axios  
✅ All repository implementations created  
✅ Factory pattern configured for switching modes  
✅ Environment configuration ready  
✅ Application builds and runs successfully  

**You are currently in: LOCAL MODE** (using localStorage)

---

## 📋 What You Need to Do

### Phase 1: Set Up Oracle APEX (Your Job 🎯)

1. **Create APEX Workspace**
   - Go to your Oracle APEX instance
   - Create new workspace: "content-platform"

2. **Create Tables**
   - CREATORS table with columns matching `Creator` interface
   - TASKS table with columns matching `Task` interface
   - MANAGERS table with columns matching `Manager` interface
   - BRANDS table (or use JSON column)

   See **APEX_INTEGRATION_GUIDE.md** for full schema definition

3. **Create REST Modules**
   - 3 main modules: /auth, /creators, /tasks, /managers, /brands
   - Each module has 6-9 endpoints
   - Test with Postman first

   See **APEX_ENDPOINT_REFERENCE.md** for all request/response formats

---

### Phase 2: Switch to API Mode (Easy! 🎉)

Once APEX is ready:

#### Step 1: Update `.env.local`
```env
# Change this:
VITE_REPOSITORY_MODE=api

# And set your APEX URL:
VITE_API_BASE_URL=http://your-oracle-instance.com/ords/workspace-name/content-platform/api
```

#### Step 2: Restart Dev Server
```bash
# Stop current: Ctrl+C
npm run dev
```

#### Step 3: Test
- Login with a creator/manager account
- Create a task
- Refresh browser - data should persist
- Check browser DevTools → Network tab to see API calls

**That's it!** Zero code changes needed. 🎉

---

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| **APEX_INTEGRATION_GUIDE.md** | Complete setup guide with all details |
| **APEX_ENDPOINT_REFERENCE.md** | Copy-paste request/response formats for each endpoint |
| **API_IMPLEMENTATION_SUMMARY.md** | Technical details of what was implemented |
| **.env.example** | Template for environment variables |
| **.env.local** | Your local development config |

---

## 🔄 How It Works

### Local Mode (Current)
```
App → LocalStorageRepository → browser localStorage
```

### API Mode (After Switching)
```
App → ApiRepository → Axios → Oracle APEX REST → Database
```

**The app code is identical in both modes!** The factory pattern handles the switch.

---

## 🧪 Testing Your APEX Implementation

Before switching the app, test each endpoint with Postman:

### Quick Test Sequence
1. **Login**
   ```
   POST /auth/login
   Body: { "username": "admin", "password": "admin" }
   Should return token
   ```

2. **List Creators**
   ```
   GET /creators
   Headers: Authorization: Bearer <token>
   Should return array
   ```

3. **Create Creator**
   ```
   POST /creators
   Body: { "name": "Test", "username": "test", "password": "123", "brands": ["Nike"] }
   Should return created creator
   ```

4. **Create Task**
   ```
   POST /tasks
   Body: { "creatorId": "...", "brand": "Nike", ... }
   Should return created task
   ```

See **APEX_ENDPOINT_REFERENCE.md** for exact formats.

---

## 🎯 Key Endpoints to Implement

### Minimum Required (Phase 1)
- [x] POST /auth/login
- [x] POST /auth/logout
- [x] GET /auth/session
- [x] GET /creators
- [x] POST /creators
- [x] PUT /creators/:id
- [x] DELETE /creators/:id

### Extended (Phase 2)
- [x] GET /tasks, POST /tasks, etc.
- [x] GET /managers, POST /managers, etc.
- [x] GET /brands, POST /brands, etc.

---

## 📝 File Structure Reference

**New Files Created:**
```
src/
├── infrastructure/
│   ├── api/
│   │   ├── api-client.ts              ← Main axios instance
│   │   ├── api-manager-service.ts     ← Manager API
│   │   └── api-brand-service.ts       ← Brand API
│   └── repositories/
│       ├── api-auth-repository.ts     ← Auth API
│       ├── api-creator-repository.ts  ← Creator API
│       ├── api-task-repository.ts     ← Task API
│       └── repository-factory.ts      ← Switches mode
```

**Modified Files:**
```
src/features/auth/context/
└── auth-provider.tsx                  ← Now uses factory
```

---

## 🔑 Environment Variables

### VITE_REPOSITORY_MODE
- `local` (default) - Use localStorage, no APEX needed
- `api` - Use Oracle APEX REST endpoints

### VITE_API_BASE_URL
- URL to your Oracle APEX REST base
- Only used when `VITE_REPOSITORY_MODE=api`
- Example: `http://localhost:8080/ords/demo/content-platform/api`

---

## ⚡ Feature Checklist

When APEX is set up, test these flows:

- [ ] Login with creator account
- [ ] Login with manager account
- [ ] Create creator
- [ ] Update creator
- [ ] Delete creator
- [ ] Create task
- [ ] Update task status
- [ ] Complete all tasks (bulk)
- [ ] Delete task
- [ ] Add brand
- [ ] Create manager
- [ ] Update manager password
- [ ] Delete manager
- [ ] Export to Excel
- [ ] Import from Excel
- [ ] 5-minute auto-logout (inactivity)
- [ ] Calendar navigation
- [ ] Task filtering by date

---

## 🐛 Debugging Tips

### API calls not working?
1. Check `.env.local` has correct `VITE_API_BASE_URL`
2. Open DevTools → Network tab
3. Check request/response for errors
4. APEX REST status codes tell you the issue:
   - 401 = auth problem
   - 404 = endpoint doesn't exist
   - 400 = bad request format

### CORS errors?
1. Configure CORS in APEX to allow your frontend
2. Allow `Content-Type` and `Authorization` headers
3. Allow `GET, POST, PUT, DELETE` methods

### Token not being sent?
1. Check login response includes `token`
2. Verify token is in `localStorage.authToken`
3. Check axios interceptor in `api-client.ts`

---

## 📚 Next Steps

1. **Read APEX_INTEGRATION_GUIDE.md** - Full details
2. **Read APEX_ENDPOINT_REFERENCE.md** - Copy endpoint formats
3. **Create APEX schema** - Design tables
4. **Implement REST modules** - ~30-50 min for all 3 modules
5. **Test with Postman** - Verify each endpoint
6. **Update .env.local** - Switch to API mode
7. **Test the app** - Login, CRUD operations
8. **Deploy** - Use appropriate URLs for prod

---

## 💡 Pro Tips

- Keep both modes working during transition
- Test API endpoints before enabling in app
- APEX errors should return proper HTTP status codes
- Use the same password hashing on APEX and frontend (or at least be consistent)
- Timestamps should be ISO 8601 format in database
- Store brands as JSON array for creators table

---

## 🆘 Need Help?

Check these docs in order:
1. **APEX_QUICKSTART.md** (this file) - Overview
2. **APEX_ENDPOINT_REFERENCE.md** - Endpoint formats
3. **APEX_INTEGRATION_GUIDE.md** - Full details
4. **API_IMPLEMENTATION_SUMMARY.md** - Technical deep dive

---

## ✅ Verification Checklist

Before declaring integration complete:

- [ ] .env.local correctly configured
- [ ] VITE_REPOSITORY_MODE=api set
- [ ] VITE_API_BASE_URL set to APEX instance
- [ ] All 5 REST modules deployed
- [ ] Each endpoint tested in Postman
- [ ] App login works with APEX credentials
- [ ] Create/read/update/delete works for all entities
- [ ] Data persists after browser refresh
- [ ] Error handling works (shows toast on error)
- [ ] Auto-logout still works (5-minute inactivity)
- [ ] Excel export/import works
- [ ] No console errors in DevTools
- [ ] Build still passes: `npm run build`

---

## 🎉 Success!

Once all checks pass, your app is fully integrated with Oracle APEX!

No code changes needed - just configuration. The separation of concerns means your app doesn't care where data comes from. 

Happy coding! 🚀
