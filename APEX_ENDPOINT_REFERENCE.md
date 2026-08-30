# Oracle APEX REST Endpoint Reference

Quick reference for all endpoints needed. Copy this when implementing REST modules in APEX.

## Base URL Structure
```
http://your-oracle-instance.com/ords/workspace-name/content-platform/api
```

Example:
```
http://localhost:8080/ords/demo/content-platform/api
```

---

## Authentication Endpoints

### POST /auth/login
Login with username and password.

**Request:**
```json
{
  "username": "john",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "creator-123",
    "username": "john",
    "name": "John Doe",
    "role": "creator",
    "creatorId": "creator-123"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": {
    "message": "Invalid username or password.",
    "code": "INVALID_CREDENTIALS"
  }
}
```

---

### POST /auth/logout
Logout current user.

**Request:** (no body)

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/session
Get current authenticated session.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "id": "creator-123",
  "username": "john",
  "name": "John Doe",
  "role": "creator",
  "creatorId": "creator-123"
}
```

**Error Response (401):**
```json
{
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

---

## Creator Endpoints

### GET /creators
List all creators (sorted by name).

**Response (200):**
```json
[
  {
    "id": "creator-1",
    "name": "Alice Smith",
    "username": "alice",
    "password": "hashed_password",
    "brands": ["Nike", "Adidas"],
    "status": "active",
    "avatarUrl": "https://...",
    "createdAt": "2024-08-29T10:30:00Z",
    "updatedAt": "2024-08-29T10:30:00Z"
  },
  {
    "id": "creator-2",
    "name": "Bob Johnson",
    "username": "bob",
    "password": "hashed_password",
    "brands": ["Puma"],
    "status": "active",
    "avatarUrl": "https://...",
    "createdAt": "2024-08-29T10:35:00Z",
    "updatedAt": "2024-08-29T10:35:00Z"
  }
]
```

---

### GET /creators/:id
Get creator by ID.

**Path Parameters:**
- `id` - Creator ID (e.g., "creator-1")

**Success Response (200):**
```json
{
  "id": "creator-1",
  "name": "Alice Smith",
  "username": "alice",
  "password": "hashed_password",
  "brands": ["Nike", "Adidas"],
  "status": "active",
  "avatarUrl": "https://...",
  "createdAt": "2024-08-29T10:30:00Z",
  "updatedAt": "2024-08-29T10:30:00Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Creator not found",
    "code": "NOT_FOUND"
  }
}
```

---

### GET /creators/username/:username
Get creator by username.

**Path Parameters:**
- `username` - Username in lowercase (e.g., "alice")

**Success Response (200):**
```json
{
  "id": "creator-1",
  "name": "Alice Smith",
  "username": "alice",
  "password": "hashed_password",
  "brands": ["Nike", "Adidas"],
  "status": "active",
  "avatarUrl": "https://...",
  "createdAt": "2024-08-29T10:30:00Z",
  "updatedAt": "2024-08-29T10:30:00Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Creator not found",
    "code": "NOT_FOUND"
  }
}
```

---

### POST /creators
Create new creator.

**Request:**
```json
{
  "name": "Charlie Brown",
  "username": "charlie",
  "password": "password123",
  "brands": ["Nike", "Puma"],
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Note:** `avatarUrl` is optional.

**Success Response (201):**
```json
{
  "id": "creator-3",
  "name": "Charlie Brown",
  "username": "charlie",
  "password": "password123",
  "brands": ["Nike", "Puma"],
  "status": "active",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-08-29T11:00:00Z",
  "updatedAt": "2024-08-29T11:00:00Z"
}
```

**Error Response (400):**
```json
{
  "error": {
    "message": "Username already exists",
    "code": "DUPLICATE_USERNAME"
  }
}
```

---

### PUT /creators/:id
Update creator.

**Path Parameters:**
- `id` - Creator ID

**Request (all fields optional):**
```json
{
  "name": "Charlie Brown Updated",
  "password": "newpassword123",
  "brands": ["Nike", "Adidas", "Puma"],
  "status": "disabled",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Success Response (200):**
```json
{
  "id": "creator-3",
  "name": "Charlie Brown Updated",
  "username": "charlie",
  "password": "newpassword123",
  "brands": ["Nike", "Adidas", "Puma"],
  "status": "disabled",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "createdAt": "2024-08-29T11:00:00Z",
  "updatedAt": "2024-08-29T11:15:00Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Creator not found",
    "code": "NOT_FOUND"
  }
}
```

---

### DELETE /creators/:id
Delete creator.

**Path Parameters:**
- `id` - Creator ID

**Success Response (204 No Content):**
```
[no body]
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Creator not found",
    "code": "NOT_FOUND"
  }
}
```

---

## Task Endpoints

### GET /tasks
List all tasks (sorted by scheduledDate).

**Response (200):**
```json
[
  {
    "id": "task-1",
    "creatorId": "creator-1",
    "brand": "Nike",
    "scheduledDate": "2024-09-05",
    "scriptLink": "https://script.example.com",
    "referenceLink": "https://reference.example.com",
    "instruction": "Film product review",
    "notes": "Include unboxing",
    "status": "not-started",
    "createdAt": "2024-08-29T10:00:00Z",
    "updatedAt": "2024-08-29T10:00:00Z"
  }
]
```

---

### GET /tasks/:id
Get task by ID.

**Path Parameters:**
- `id` - Task ID

**Success Response (200):**
```json
{
  "id": "task-1",
  "creatorId": "creator-1",
  "brand": "Nike",
  "scheduledDate": "2024-09-05",
  "scriptLink": "https://script.example.com",
  "referenceLink": "https://reference.example.com",
  "instruction": "Film product review",
  "notes": "Include unboxing",
  "status": "not-started",
  "createdAt": "2024-08-29T10:00:00Z",
  "updatedAt": "2024-08-29T10:00:00Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Task not found",
    "code": "NOT_FOUND"
  }
}
```

---

### GET /tasks/date/:date
Get all tasks for a specific date.

**Path Parameters:**
- `date` - Date in YYYY-MM-DD format (e.g., "2024-09-05")

**Response (200):**
```json
[
  {
    "id": "task-1",
    "creatorId": "creator-1",
    "brand": "Nike",
    "scheduledDate": "2024-09-05",
    "scriptLink": "https://script.example.com",
    "referenceLink": "https://reference.example.com",
    "instruction": "Film product review",
    "notes": "Include unboxing",
    "status": "not-started",
    "createdAt": "2024-08-29T10:00:00Z",
    "updatedAt": "2024-08-29T10:00:00Z"
  }
]
```

---

### GET /tasks/creator/:creatorId
Get all tasks for a creator.

**Path Parameters:**
- `creatorId` - Creator ID (e.g., "creator-1")

**Response (200):**
```json
[
  {
    "id": "task-1",
    "creatorId": "creator-1",
    "brand": "Nike",
    "scheduledDate": "2024-09-05",
    "scriptLink": "https://script.example.com",
    "referenceLink": "https://reference.example.com",
    "instruction": "Film product review",
    "notes": "Include unboxing",
    "status": "not-started",
    "createdAt": "2024-08-29T10:00:00Z",
    "updatedAt": "2024-08-29T10:00:00Z"
  }
]
```

---

### POST /tasks
Create new task.

**Request:**
```json
{
  "creatorId": "creator-1",
  "brand": "Nike",
  "scheduledDate": "2024-09-05",
  "scriptLink": "https://script.example.com",
  "instruction": "Film product review",
  "notes": "Include unboxing",
  "referenceLink": "https://reference.example.com",
  "status": "not-started"
}
```

**Notes:**
- `status` defaults to "not-started" if not provided
- `referenceLink` is optional

**Success Response (201):**
```json
{
  "id": "task-1",
  "creatorId": "creator-1",
  "brand": "Nike",
  "scheduledDate": "2024-09-05",
  "scriptLink": "https://script.example.com",
  "referenceLink": "https://reference.example.com",
  "instruction": "Film product review",
  "notes": "Include unboxing",
  "status": "not-started",
  "createdAt": "2024-08-29T10:00:00Z",
  "updatedAt": "2024-08-29T10:00:00Z"
}
```

---

### PUT /tasks/:id
Update task.

**Path Parameters:**
- `id` - Task ID

**Request (all fields optional):**
```json
{
  "status": "completed",
  "notes": "Include unboxing - DONE"
}
```

**Success Response (200):**
```json
{
  "id": "task-1",
  "creatorId": "creator-1",
  "brand": "Nike",
  "scheduledDate": "2024-09-05",
  "scriptLink": "https://script.example.com",
  "referenceLink": "https://reference.example.com",
  "instruction": "Film product review",
  "notes": "Include unboxing - DONE",
  "status": "completed",
  "createdAt": "2024-08-29T10:00:00Z",
  "updatedAt": "2024-08-29T12:30:00Z"
}
```

**Valid status values:**
- `"not-started"`
- `"in-progress"`
- `"completed"`
- `"overdue"` (derived on client based on date)

---

### DELETE /tasks/:id
Delete task.

**Path Parameters:**
- `id` - Task ID

**Success Response (204 No Content):**
```
[no body]
```

---

## Manager Endpoints

### GET /managers
List all managers.

**Response (200):**
```json
[
  {
    "id": "manager-1",
    "name": "David Manager",
    "username": "david",
    "password": "hashed_password",
    "avatarUrl": "https://...",
    "createdAt": "2024-08-29T10:00:00Z",
    "updatedAt": "2024-08-29T10:00:00Z"
  }
]
```

---

### GET /managers/:id
Get manager by ID.

**Path Parameters:**
- `id` - Manager ID

**Success Response (200):**
```json
{
  "id": "manager-1",
  "name": "David Manager",
  "username": "david",
  "password": "hashed_password",
  "avatarUrl": "https://...",
  "createdAt": "2024-08-29T10:00:00Z",
  "updatedAt": "2024-08-29T10:00:00Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Manager not found",
    "code": "NOT_FOUND"
  }
}
```

---

### GET /managers/username/:username
Get manager by username.

**Path Parameters:**
- `username` - Username in lowercase (e.g., "david")

**Success Response (200):**
```json
{
  "id": "manager-1",
  "name": "David Manager",
  "username": "david",
  "password": "hashed_password",
  "avatarUrl": "https://...",
  "createdAt": "2024-08-29T10:00:00Z",
  "updatedAt": "2024-08-29T10:00:00Z"
}
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Manager not found",
    "code": "NOT_FOUND"
  }
}
```

---

### POST /managers
Create new manager.

**Request:**
```json
{
  "name": "Emma Manager",
  "username": "emma",
  "password": "password123",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Note:** `avatarUrl` is optional.

**Success Response (201):**
```json
{
  "id": "manager-2",
  "name": "Emma Manager",
  "username": "emma",
  "password": "password123",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-08-29T11:00:00Z",
  "updatedAt": "2024-08-29T11:00:00Z"
}
```

---

### PUT /managers/:id
Update manager.

**Path Parameters:**
- `id` - Manager ID

**Request (all fields optional):**
```json
{
  "name": "Emma Manager Updated",
  "password": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "id": "manager-2",
  "name": "Emma Manager Updated",
  "username": "emma",
  "password": "newpassword123",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-08-29T11:00:00Z",
  "updatedAt": "2024-08-29T11:15:00Z"
}
```

---

### DELETE /managers/:id
Delete manager.

**Path Parameters:**
- `id` - Manager ID

**Success Response (204 No Content):**
```
[no body]
```

---

## Brand Endpoints

### GET /brands
Get all available brands.

**Response (200):**
```json
[
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "New Balance",
  "Asics",
  "Saucony",
  "HOKA"
]
```

---

### POST /brands/initialize
Initialize brands with defaults.

**Request:**
```json
{
  "brands": [
    "Nike",
    "Adidas",
    "Puma",
    "Reebok",
    "New Balance",
    "Asics",
    "Saucony",
    "HOKA"
  ]
}
```

**Success Response (200):**
```json
{
  "message": "Brands initialized"
}
```

---

### POST /brands
Add new brand.

**Request:**
```json
{
  "brand": "Salomon"
}
```

**Success Response (201):**
```json
{
  "message": "Brand added",
  "brand": "Salomon"
}
```

**Error Response (400 - duplicate):**
```json
{
  "error": {
    "message": "Brand already exists",
    "code": "DUPLICATE_BRAND"
  }
}
```

---

### DELETE /brands/:brand
Remove brand.

**Path Parameters:**
- `brand` - Brand name (e.g., "Salomon")

**Success Response (204 No Content):**
```
[no body]
```

**Error Response (404):**
```json
{
  "error": {
    "message": "Brand not found",
    "code": "NOT_FOUND"
  }
}
```

---

## Common Response Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, duplicate record |
| 401 | Unauthorized | Missing/invalid auth token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database/server issue |

---

## HTTP Headers

**All requests should include:**
```
Content-Type: application/json
```

**Authenticated requests include:**
```
Authorization: Bearer <token_from_login>
```

---

## Notes for APEX Implementation

1. **IDs** - Generate using timestamp + random: `creator-${Date.now()}-${random}`
2. **Timestamps** - Use ISO 8601 format: `2024-08-29T10:30:00Z`
3. **Username** - Always normalize to lowercase in database
4. **Brands** - Store as JSON array in database
5. **Status** - Use exact values: "active", "disabled" for creators; "not-started", "in-progress", "completed" for tasks
6. **Overdue Status** - Client derives this based on date; API never stores it
7. **CORS** - Configure to allow frontend origin with credentials
8. **Authentication** - Token expires after session timeout (match with frontend inactivity timeout)

