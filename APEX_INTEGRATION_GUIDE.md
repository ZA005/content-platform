# Oracle APEX Integration Guide

This guide explains how to integrate your Oracle APEX REST modules with the content-platform application.

## Architecture Overview

The application uses a repository pattern that allows switching between two data sources:

1. **Local Storage Mode** (default): All data stored in browser localStorage
2. **API Mode**: Data persisted in Oracle APEX via REST endpoints

The repository factory determines which implementation to use based on the `VITE_REPOSITORY_MODE` environment variable.

## File Structure

```
src/
├── infrastructure/
│   ├── api/
│   │   ├── api-client.ts              # Axios instance with interceptors
│   │   ├── api-manager-service.ts     # Manager API calls
│   │   └── api-brand-service.ts       # Brand API calls
│   └── repositories/
│       ├── repository-factory.ts      # Factory to switch implementations
│       ├── api-auth-repository.ts     # Authentication endpoints
│       ├── api-creator-repository.ts  # Creator endpoints
│       ├── api-task-repository.ts     # Task endpoints
│       ├── local-storage-*.ts         # Legacy localStorage implementations
└── features/auth/context/
    └── auth-provider.tsx              # Uses factory to get auth repository
```

## Setup Instructions

### Step 1: Create Environment Configuration

Copy `.env.example` to `.env.local` (already done):

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Switch to API mode when Oracle APEX is ready
VITE_REPOSITORY_MODE=api

# Your Oracle APEX REST endpoint
VITE_API_BASE_URL=http://your-oracle-instance.com/ords/workspace/content-platform/api
```

### Step 2: Create Oracle APEX REST Modules

In your Oracle APEX workspace, create REST modules with the following endpoints:

#### Authentication Endpoints

**POST /auth/login**
- Input: `{ username: string, password: string }`
- Output: `{ user: AuthUser, token: string }`
- Returns 401 if credentials invalid

**POST /auth/logout**
- No input required
- Clears server-side session

**GET /auth/session**
- Returns current user if authenticated
- Returns 401 if not authenticated

#### Creator Endpoints

**GET /creators**
- Returns: `Creator[]` (sorted by name)

**GET /creators/:id**
- Param: creator ID
- Returns: `Creator`
- Returns 404 if not found

**GET /creators/username/:username**
- Param: normalized username (lowercase)
- Returns: `Creator`
- Returns 404 if not found

**POST /creators**
- Input: `CreateCreatorInput { name, username, password, brands: string[], avatarUrl? }`
- Returns: `Creator` with generated ID, timestamps
- Returns 400 if username exists

**PUT /creators/:id**
- Input: `UpdateCreatorInput` (all fields optional)
- Returns: updated `Creator`
- Returns 404 if not found

**DELETE /creators/:id**
- No return value
- Returns 404 if not found

#### Task Endpoints

**GET /tasks**
- Returns: `Task[]` (sorted by scheduledDate)

**GET /tasks/:id**
- Returns: `Task`
- Returns 404 if not found

**GET /tasks/date/:date**
- Param: date in YYYY-MM-DD format
- Returns: `Task[]` for that date

**GET /tasks/creator/:creatorId**
- Param: creator ID
- Returns: `Task[]` for that creator

**POST /tasks**
- Input: `CreateTaskInput { creatorId, brand, scheduledDate, scriptLink, instruction, notes, referenceLink?, status? }`
- Returns: `Task` with generated ID, timestamps
- Status defaults to "not-started"

**PUT /tasks/:id**
- Input: `UpdateTaskInput` (all fields optional)
- Returns: updated `Task`
- Returns 404 if not found

**DELETE /tasks/:id**
- No return value
- Returns 404 if not found

#### Manager Endpoints

**GET /managers**
- Returns: `Manager[]`

**GET /managers/:id**
- Returns: `Manager`
- Returns 404 if not found

**GET /managers/username/:username**
- Param: normalized username (lowercase)
- Returns: `Manager`
- Returns 404 if not found

**POST /managers**
- Input: `{ name, username, password, avatarUrl? }`
- Returns: `Manager` with generated ID, timestamps
- Returns 400 if username exists

**PUT /managers/:id**
- Input: partial `Manager` object
- Returns: updated `Manager`
- Returns 404 if not found

**DELETE /managers/:id**
- No return value
- Returns 404 if not found

#### Brand Endpoints

**GET /brands**
- Returns: `string[]` of all available brands

**POST /brands/initialize**
- Input: `{ brands: string[] }`
- Initializes brands if not already set

**POST /brands**
- Input: `{ brand: string }`
- Adds brand to list (deduplicates)

**DELETE /brands/:brand**
- Removes brand from list

### Step 3: Type Definitions for APEX

Reference these TypeScript interfaces when creating your APEX tables:

```typescript
// Creator
interface Creator {
  id: string;
  name: string;
  username: string;
  password: string;
  brands: string[]; // JSON array
  status: "active" | "disabled";
  avatarUrl: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Task
interface Task {
  id: string;
  creatorId: string;
  brand: string;
  scheduledDate: string; // YYYY-MM-DD
  scriptLink: string;
  referenceLink?: string;
  instruction: string;
  notes: string;
  status: "not-started" | "in-progress" | "completed" | "overdue";
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Manager
interface Manager {
  id: string;
  name: string;
  username: string;
  password: string;
  avatarUrl: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// AuthUser (returned on login)
interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "creator" | "manager";
  creatorId?: string; // Only for creators
}

// Session
interface Session {
  user: AuthUser;
  issuedAt: string; // ISO 8601
}
```

### Step 4: Testing the Integration

1. **Keep localStorage mode while building APEX**
   ```
   VITE_REPOSITORY_MODE=local
   ```

2. **Test APEX endpoints independently**
   - Use Postman or similar tool to verify endpoints
   - Ensure proper request/response formats
   - Test error cases (404, 400, 401)

3. **Switch to API mode for testing**
   ```
   VITE_REPOSITORY_MODE=api
   VITE_API_BASE_URL=http://your-apex-instance.com/ords/workspace/content-platform/api
   ```

4. **Run full application test**
   ```bash
   npm run dev
   # Test login, create/edit/delete creators, tasks, managers
   # Verify data persistence across browser refresh
   ```

## API Response Formats

All endpoints should return standardized responses:

### Success Response
```json
{
  "data": { /* entity or array */ }
}
```

### Error Response
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

## Authentication

The app uses token-based authentication:

1. Login endpoint returns a JWT or session token
2. Token is stored in `localStorage.authToken`
3. Token automatically sent in `Authorization: Bearer <token>` header for all requests
4. Invalid/expired tokens trigger automatic logout and redirect to login page

## CORS Configuration

Ensure your Oracle APEX instance allows CORS requests from your frontend domain:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Fallback Behavior

If API calls fail:
- Authentication errors show error toast and redirect to login
- CRUD operations show error toast but don't crash the app
- List operations return cached data if available
- Brands service returns default brands as fallback

## Switching Between Modes

To switch back to localStorage:
1. Edit `.env.local`:
   ```
   VITE_REPOSITORY_MODE=local
   ```
2. Restart dev server
3. No code changes needed - repository factory handles it

## Troubleshooting

### CORS Errors
- Check Oracle APEX CORS configuration
- Verify frontend URL matches allowed origins
- Check browser console for specific error message

### 404 on API Calls
- Verify API_BASE_URL in .env.local matches APEX instance
- Confirm REST modules are deployed and public
- Check URL path structure (workspace, module names)

### 401 Authentication Errors
- Ensure login endpoint returns valid token
- Verify token is being sent in Authorization header
- Check Oracle session/token expiration on backend

### Data Not Persisting
- Verify PUT/POST endpoints return updated entity
- Confirm database commits are happening
- Check server logs for SQL errors

## Production Considerations

1. **Environment Variables**
   - Use different VITE_API_BASE_URL for staging/production
   - Never commit `.env.local` to version control

2. **Security**
   - Always use HTTPS in production
   - Implement proper password hashing on backend
   - Add rate limiting to prevent brute force
   - Validate all inputs server-side

3. **Error Handling**
   - Add retry logic for transient failures
   - Implement circuit breaker for failing endpoints
   - Log errors for monitoring/debugging

4. **Performance**
   - Implement pagination for list endpoints
   - Add caching where appropriate
   - Monitor API response times

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API response in browser DevTools Network tab
3. Verify Oracle APEX REST module logs
4. Ensure type definitions match APEX schema
