# Oracle APEX REST API - PL/SQL Implementation Guide

## Table of Contents
1. [Database Schema](#database-schema)
2. [Authentication Procedures](#authentication-procedures)
3. [Creator Handlers](#creator-handlers)
4. [Task Handlers](#task-handlers)
5. [Manager Handlers](#manager-handlers)
6. [Brand Handlers](#brand-handlers)
7. [Error Handling Utilities](#error-handling-utilities)

---

## Database Schema

Run these scripts first to create the tables:

### Create Tables

```sql
-- Create CREATORS table
CREATE TABLE creators (
  id VARCHAR2(100) PRIMARY KEY,
  name VARCHAR2(255) NOT NULL,
  username VARCHAR2(100) NOT NULL UNIQUE,
  password VARCHAR2(255) NOT NULL,
  brands CLOB NOT NULL, -- JSON array stored as string
  status VARCHAR2(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  avatar_url VARCHAR2(500),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Create TASKS table
CREATE TABLE tasks (
  id VARCHAR2(100) PRIMARY KEY,
  creator_id VARCHAR2(100) NOT NULL,
  brand VARCHAR2(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  script_link VARCHAR2(500) NOT NULL,
  reference_link VARCHAR2(500),
  instruction CLOB NOT NULL,
  notes CLOB,
  status VARCHAR2(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'overdue')),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);

-- Create MANAGERS table
CREATE TABLE managers (
  id VARCHAR2(100) PRIMARY KEY,
  name VARCHAR2(255) NOT NULL,
  username VARCHAR2(100) NOT NULL UNIQUE,
  password VARCHAR2(255) NOT NULL,
  avatar_url VARCHAR2(500),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Create BRANDS table
CREATE TABLE brands (
  brand_name VARCHAR2(100) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Create SESSIONS table for token management
CREATE TABLE sessions (
  token_id VARCHAR2(100) PRIMARY KEY,
  user_id VARCHAR2(100) NOT NULL,
  user_role VARCHAR2(20) NOT NULL, -- 'admin', 'creator', 'manager'
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_tasks_creator_date ON tasks(creator_id, scheduled_date);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_managers_username ON managers(username);
CREATE INDEX idx_sessions_token ON sessions(token_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### Insert Default Brands

```sql
INSERT INTO brands (brand_name) VALUES ('Nike');
INSERT INTO brands (brand_name) VALUES ('Adidas');
INSERT INTO brands (brand_name) VALUES ('Puma');
INSERT INTO brands (brand_name) VALUES ('Reebok');
INSERT INTO brands (brand_name) VALUES ('New Balance');
INSERT INTO brands (brand_name) VALUES ('Asics');
INSERT INTO brands (brand_name) VALUES ('Saucony');
INSERT INTO brands (brand_name) VALUES ('HOKA');
COMMIT;
```

### Create Admin User (Default)

```sql
INSERT INTO creators (
  id, name, username, password, brands, status, created_at, updated_at
) VALUES (
  'admin',
  'Admin',
  'admin',
  'admin', -- In production, hash this password!
  '[]',
  'active',
  SYSTIMESTAMP,
  SYSTIMESTAMP
);
COMMIT;
```

---

## Utility Package

Create a package for shared utilities:

```sql
CREATE OR REPLACE PACKAGE content_platform_utils AS
  -- Generate unique ID
  FUNCTION generate_id(p_prefix VARCHAR2) RETURN VARCHAR2;
  
  -- Hash password (basic example - use proper hashing in production!)
  FUNCTION hash_password(p_password VARCHAR2) RETURN VARCHAR2;
  
  -- Check password
  FUNCTION check_password(p_input VARCHAR2, p_stored VARCHAR2) RETURN BOOLEAN;
  
  -- Generate JWT token (simplified)
  FUNCTION generate_token(p_user_id VARCHAR2, p_role VARCHAR2) RETURN VARCHAR2;
  
  -- Get user from token
  PROCEDURE get_user_from_token(
    p_token VARCHAR2,
    p_user_id OUT VARCHAR2,
    p_user_role OUT VARCHAR2,
    p_is_valid OUT BOOLEAN
  );
  
  -- Return JSON response
  FUNCTION json_response(p_status VARCHAR2, p_data CLOB) RETURN CLOB;
  
  -- Return JSON error
  FUNCTION json_error(p_message VARCHAR2, p_code VARCHAR2) RETURN CLOB;
  
END content_platform_utils;
/

CREATE OR REPLACE PACKAGE BODY content_platform_utils AS

  FUNCTION generate_id(p_prefix VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    RETURN p_prefix || '-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MISSFF') || 
           '-' || SUBSTR(DBMS_RANDOM.STRING('X', 6), 1, 6);
  END generate_id;

  FUNCTION hash_password(p_password VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    -- IMPORTANT: Use proper hashing in production (bcrypt, scrypt, Argon2)
    -- This is a simplified example - DO NOT use in production!
    RETURN p_password;
  END hash_password;

  FUNCTION check_password(p_input VARCHAR2, p_stored VARCHAR2) RETURN BOOLEAN IS
  BEGIN
    -- In production, use proper comparison logic
    RETURN p_input = p_stored;
  END check_password;

  FUNCTION generate_token(p_user_id VARCHAR2, p_role VARCHAR2) RETURN VARCHAR2 IS
    v_token VARCHAR2(100);
  BEGIN
    v_token := content_platform_utils.generate_id('token');
    
    INSERT INTO sessions (token_id, user_id, user_role, created_at, expires_at)
    VALUES (
      v_token,
      p_user_id,
      p_role,
      SYSTIMESTAMP,
      SYSTIMESTAMP + INTERVAL '8' HOUR
    );
    COMMIT;
    
    RETURN v_token;
  END generate_token;

  PROCEDURE get_user_from_token(
    p_token VARCHAR2,
    p_user_id OUT VARCHAR2,
    p_user_role OUT VARCHAR2,
    p_is_valid OUT BOOLEAN
  ) IS
  BEGIN
    p_is_valid := FALSE;
    
    SELECT user_id, user_role
    INTO p_user_id, p_user_role
    FROM sessions
    WHERE token_id = p_token
      AND expires_at > SYSTIMESTAMP;
    
    p_is_valid := TRUE;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      p_is_valid := FALSE;
  END get_user_from_token;

  FUNCTION json_response(p_status VARCHAR2, p_data CLOB) RETURN CLOB IS
  BEGIN
    RETURN '{' ||
           '"status":"' || p_status || '",' ||
           '"data":' || p_data ||
           '}';
  END json_response;

  FUNCTION json_error(p_message VARCHAR2, p_code VARCHAR2) RETURN CLOB IS
  BEGIN
    RETURN '{' ||
           '"error":{' ||
           '"message":"' || REPLACE(p_message, '"', '\"') || '",' ||
           '"code":"' || p_code || '"' ||
           '}}';
  END json_error;

END content_platform_utils;
/
```

---

## Authentication Procedures

### POST /auth/login

```sql
CREATE OR REPLACE PROCEDURE auth_login(
  p_username VARCHAR2,
  p_password VARCHAR2,
  p_response OUT CLOB
) AS
  v_creator_id creators.id%TYPE;
  v_creator_name creators.name%TYPE;
  v_manager_id managers.id%TYPE;
  v_manager_name managers.name%TYPE;
  v_token VARCHAR2(100);
  v_user_data CLOB;
BEGIN
  -- Try creator login first
  BEGIN
    SELECT id, name
    INTO v_creator_id, v_creator_name
    FROM creators
    WHERE LOWER(username) = LOWER(p_username)
      AND password = p_password;
    
    -- Creator found, generate token
    v_token := content_platform_utils.generate_token(v_creator_id, 'creator');
    
    v_user_data := '{' ||
      '"id":"' || v_creator_id || '",' ||
      '"username":"' || p_username || '",' ||
      '"name":"' || v_creator_name || '",' ||
      '"role":"creator",' ||
      '"creatorId":"' || v_creator_id || '"' ||
      '}';
    
    p_response := '{' ||
      '"user":' || v_user_data || ',' ||
      '"token":"' || v_token || '"' ||
      '}';
    RETURN;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      NULL;
  END;

  -- Try manager login
  BEGIN
    SELECT id, name
    INTO v_manager_id, v_manager_name
    FROM managers
    WHERE LOWER(username) = LOWER(p_username)
      AND password = p_password;
    
    -- Manager found, generate token
    v_token := content_platform_utils.generate_token(v_manager_id, 'manager');
    
    v_user_data := '{' ||
      '"id":"' || v_manager_id || '",' ||
      '"username":"' || p_username || '",' ||
      '"name":"' || v_manager_name || '",' ||
      '"role":"manager"' ||
      '}';
    
    p_response := '{' ||
      '"user":' || v_user_data || ',' ||
      '"token":"' || v_token || '"' ||
      '}';
    RETURN;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      NULL;
  END;

  -- Admin login (hardcoded for demo - update as needed)
  IF LOWER(p_username) = 'admin' AND p_password = 'admin' THEN
    v_token := content_platform_utils.generate_token('admin', 'admin');
    
    v_user_data := '{' ||
      '"id":"admin",' ||
      '"username":"admin",' ||
      '"name":"Admin",' ||
      '"role":"admin"' ||
      '}';
    
    p_response := '{' ||
      '"user":' || v_user_data || ',' ||
      '"token":"' || v_token || '"' ||
      '}';
    RETURN;
  END IF;

  -- No match found
  p_response := content_platform_utils.json_error('Invalid username or password', 'INVALID_CREDENTIALS');

END auth_login;
/
```

### POST /auth/logout

```sql
CREATE OR REPLACE PROCEDURE auth_logout(
  p_token VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  DELETE FROM sessions WHERE token_id = p_token;
  COMMIT;
  
  p_response := '{"message":"Logged out successfully"}';
END auth_logout;
/
```

### GET /auth/session

```sql
CREATE OR REPLACE PROCEDURE auth_get_session(
  p_token VARCHAR2,
  p_response OUT CLOB
) AS
  v_user_id sessions.user_id%TYPE;
  v_user_role sessions.user_role%TYPE;
  v_is_valid BOOLEAN;
BEGIN
  content_platform_utils.get_user_from_token(p_token, v_user_id, v_user_role, v_is_valid);
  
  IF NOT v_is_valid THEN
    p_response := content_platform_utils.json_error('Unauthorized', 'UNAUTHORIZED');
    RETURN;
  END IF;

  -- Get user details based on role
  IF v_user_role = 'creator' THEN
    SELECT JSON_OBJECT(
      'id' VALUE id,
      'username' VALUE username,
      'name' VALUE name,
      'role' VALUE 'creator',
      'creatorId' VALUE id
    ).getclobval() INTO p_response
    FROM creators WHERE id = v_user_id;
  ELSIF v_user_role = 'manager' THEN
    SELECT JSON_OBJECT(
      'id' VALUE id,
      'username' VALUE username,
      'name' VALUE name,
      'role' VALUE 'manager'
    ).getclobval() INTO p_response
    FROM managers WHERE id = v_user_id;
  ELSIF v_user_role = 'admin' THEN
    p_response := JSON_OBJECT(
      'id' VALUE 'admin',
      'username' VALUE 'admin',
      'name' VALUE 'Admin',
      'role' VALUE 'admin'
    ).getclobval();
  END IF;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_response := content_platform_utils.json_error('User not found', 'NOT_FOUND');
END auth_get_session;
/
```

---

## Creator Handlers

### GET /creators

```sql
CREATE OR REPLACE PROCEDURE creators_list(
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id' VALUE id,
      'name' VALUE name,
      'username' VALUE username,
      'password' VALUE password,
      'brands' VALUE JSON_PARSE(brands),
      'status' VALUE status,
      'avatarUrl' VALUE avatar_url,
      'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
      'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
    ) ORDER BY name
  ).getclobval() INTO p_response
  FROM creators;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch creators', 'DB_ERROR');
END creators_list;
/
```

### GET /creators/:id

```sql
CREATE OR REPLACE PROCEDURE creators_get_by_id(
  p_id VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'brands' VALUE JSON_PARSE(brands),
    'status' VALUE status,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM creators
  WHERE id = p_id;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_response := content_platform_utils.json_error('Creator not found', 'NOT_FOUND');
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch creator', 'DB_ERROR');
END creators_get_by_id;
/
```

### GET /creators/username/:username

```sql
CREATE OR REPLACE PROCEDURE creators_get_by_username(
  p_username VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'brands' VALUE JSON_PARSE(brands),
    'status' VALUE status,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM creators
  WHERE LOWER(username) = LOWER(p_username);

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_response := content_platform_utils.json_error('Creator not found', 'NOT_FOUND');
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch creator', 'DB_ERROR');
END creators_get_by_username;
/
```

### POST /creators

```sql
CREATE OR REPLACE PROCEDURE creators_create(
  p_name VARCHAR2,
  p_username VARCHAR2,
  p_password VARCHAR2,
  p_brands CLOB,
  p_avatar_url VARCHAR2 DEFAULT NULL,
  p_response OUT CLOB
) AS
  v_id VARCHAR2(100);
  v_exists NUMBER;
BEGIN
  -- Check if username exists
  SELECT COUNT(*) INTO v_exists FROM creators WHERE LOWER(username) = LOWER(p_username);
  IF v_exists > 0 THEN
    p_response := content_platform_utils.json_error('Username already exists', 'DUPLICATE_USERNAME');
    RETURN;
  END IF;

  v_id := content_platform_utils.generate_id('creator');

  INSERT INTO creators (
    id, name, username, password, brands, avatar_url, status, created_at, updated_at
  ) VALUES (
    v_id,
    p_name,
    p_username,
    p_password,
    p_brands,
    p_avatar_url,
    'active',
    SYSTIMESTAMP,
    SYSTIMESTAMP
  );
  COMMIT;

  -- Return created creator
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'brands' VALUE JSON_PARSE(brands),
    'status' VALUE status,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM creators
  WHERE id = v_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to create creator', 'DB_ERROR');
END creators_create;
/
```

### PUT /creators/:id

```sql
CREATE OR REPLACE PROCEDURE creators_update(
  p_id VARCHAR2,
  p_name VARCHAR2 DEFAULT NULL,
  p_username VARCHAR2 DEFAULT NULL,
  p_password VARCHAR2 DEFAULT NULL,
  p_brands CLOB DEFAULT NULL,
  p_status VARCHAR2 DEFAULT NULL,
  p_avatar_url VARCHAR2 DEFAULT NULL,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  -- Check if creator exists
  SELECT COUNT(*) INTO v_exists FROM creators WHERE id = p_id;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Creator not found', 'NOT_FOUND');
    RETURN;
  END IF;

  -- Update fields
  UPDATE creators SET
    name = NVL(p_name, name),
    username = NVL(p_username, username),
    password = NVL(p_password, password),
    brands = NVL(p_brands, brands),
    status = NVL(p_status, status),
    avatar_url = NVL(p_avatar_url, avatar_url),
    updated_at = SYSTIMESTAMP
  WHERE id = p_id;
  COMMIT;

  -- Return updated creator
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'brands' VALUE JSON_PARSE(brands),
    'status' VALUE status,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM creators
  WHERE id = p_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to update creator', 'DB_ERROR');
END creators_update;
/
```

### DELETE /creators/:id

```sql
CREATE OR REPLACE PROCEDURE creators_delete(
  p_id VARCHAR2,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM creators WHERE id = p_id;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Creator not found', 'NOT_FOUND');
    RETURN;
  END IF;

  -- Delete associated tasks first
  DELETE FROM tasks WHERE creator_id = p_id;
  
  -- Delete creator
  DELETE FROM creators WHERE id = p_id;
  COMMIT;

  p_response := '{"message":"Creator deleted successfully"}';

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to delete creator', 'DB_ERROR');
END creators_delete;
/
```

---

## Task Handlers

### GET /tasks

```sql
CREATE OR REPLACE PROCEDURE tasks_list(
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id' VALUE id,
      'creatorId' VALUE creator_id,
      'brand' VALUE brand,
      'scheduledDate' VALUE TO_CHAR(scheduled_date, 'YYYY-MM-DD'),
      'scriptLink' VALUE script_link,
      'referenceLink' VALUE reference_link,
      'instruction' VALUE instruction,
      'notes' VALUE notes,
      'status' VALUE status,
      'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
      'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
    ) ORDER BY scheduled_date
  ).getclobval() INTO p_response
  FROM tasks;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch tasks', 'DB_ERROR');
END tasks_list;
/
```

### GET /tasks/:id

```sql
CREATE OR REPLACE PROCEDURE tasks_get_by_id(
  p_id VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'creatorId' VALUE creator_id,
    'brand' VALUE brand,
    'scheduledDate' VALUE TO_CHAR(scheduled_date, 'YYYY-MM-DD'),
    'scriptLink' VALUE script_link,
    'referenceLink' VALUE reference_link,
    'instruction' VALUE instruction,
    'notes' VALUE notes,
    'status' VALUE status,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM tasks
  WHERE id = p_id;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_response := content_platform_utils.json_error('Task not found', 'NOT_FOUND');
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch task', 'DB_ERROR');
END tasks_get_by_id;
/
```

### GET /tasks/date/:date

```sql
CREATE OR REPLACE PROCEDURE tasks_list_by_date(
  p_date VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id' VALUE id,
      'creatorId' VALUE creator_id,
      'brand' VALUE brand,
      'scheduledDate' VALUE TO_CHAR(scheduled_date, 'YYYY-MM-DD'),
      'scriptLink' VALUE script_link,
      'referenceLink' VALUE reference_link,
      'instruction' VALUE instruction,
      'notes' VALUE notes,
      'status' VALUE status,
      'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
      'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
    ) ORDER BY scheduled_date
  ).getclobval() INTO p_response
  FROM tasks
  WHERE TO_CHAR(scheduled_date, 'YYYY-MM-DD') = p_date;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch tasks', 'DB_ERROR');
END tasks_list_by_date;
/
```

### GET /tasks/creator/:creatorId

```sql
CREATE OR REPLACE PROCEDURE tasks_list_by_creator(
  p_creator_id VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id' VALUE id,
      'creatorId' VALUE creator_id,
      'brand' VALUE brand,
      'scheduledDate' VALUE TO_CHAR(scheduled_date, 'YYYY-MM-DD'),
      'scriptLink' VALUE script_link,
      'referenceLink' VALUE reference_link,
      'instruction' VALUE instruction,
      'notes' VALUE notes,
      'status' VALUE status,
      'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
      'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
    ) ORDER BY scheduled_date
  ).getclobval() INTO p_response
  FROM tasks
  WHERE creator_id = p_creator_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch tasks', 'DB_ERROR');
END tasks_list_by_creator;
/
```

### POST /tasks

```sql
CREATE OR REPLACE PROCEDURE tasks_create(
  p_creator_id VARCHAR2,
  p_brand VARCHAR2,
  p_scheduled_date VARCHAR2,
  p_script_link VARCHAR2,
  p_instruction CLOB,
  p_notes CLOB,
  p_reference_link VARCHAR2 DEFAULT NULL,
  p_status VARCHAR2 DEFAULT 'not-started',
  p_response OUT CLOB
) AS
  v_id VARCHAR2(100);
BEGIN
  v_id := content_platform_utils.generate_id('task');

  INSERT INTO tasks (
    id, creator_id, brand, scheduled_date, script_link, instruction, 
    notes, reference_link, status, created_at, updated_at
  ) VALUES (
    v_id,
    p_creator_id,
    p_brand,
    TO_DATE(p_scheduled_date, 'YYYY-MM-DD'),
    p_script_link,
    p_instruction,
    p_notes,
    p_reference_link,
    p_status,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  );
  COMMIT;

  -- Return created task
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'creatorId' VALUE creator_id,
    'brand' VALUE brand,
    'scheduledDate' VALUE TO_CHAR(scheduled_date, 'YYYY-MM-DD'),
    'scriptLink' VALUE script_link,
    'referenceLink' VALUE reference_link,
    'instruction' VALUE instruction,
    'notes' VALUE notes,
    'status' VALUE status,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM tasks
  WHERE id = v_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to create task', 'DB_ERROR');
END tasks_create;
/
```

### PUT /tasks/:id

```sql
CREATE OR REPLACE PROCEDURE tasks_update(
  p_id VARCHAR2,
  p_creator_id VARCHAR2 DEFAULT NULL,
  p_brand VARCHAR2 DEFAULT NULL,
  p_scheduled_date VARCHAR2 DEFAULT NULL,
  p_script_link VARCHAR2 DEFAULT NULL,
  p_instruction CLOB DEFAULT NULL,
  p_notes CLOB DEFAULT NULL,
  p_reference_link VARCHAR2 DEFAULT NULL,
  p_status VARCHAR2 DEFAULT NULL,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM tasks WHERE id = p_id;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Task not found', 'NOT_FOUND');
    RETURN;
  END IF;

  UPDATE tasks SET
    creator_id = NVL(p_creator_id, creator_id),
    brand = NVL(p_brand, brand),
    scheduled_date = NVL(CASE WHEN p_scheduled_date IS NOT NULL THEN TO_DATE(p_scheduled_date, 'YYYY-MM-DD') END, scheduled_date),
    script_link = NVL(p_script_link, script_link),
    instruction = NVL(p_instruction, instruction),
    notes = NVL(p_notes, notes),
    reference_link = NVL(p_reference_link, reference_link),
    status = NVL(p_status, status),
    updated_at = SYSTIMESTAMP
  WHERE id = p_id;
  COMMIT;

  -- Return updated task
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'creatorId' VALUE creator_id,
    'brand' VALUE brand,
    'scheduledDate' VALUE TO_CHAR(scheduled_date, 'YYYY-MM-DD'),
    'scriptLink' VALUE script_link,
    'referenceLink' VALUE reference_link,
    'instruction' VALUE instruction,
    'notes' VALUE notes,
    'status' VALUE status,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM tasks
  WHERE id = p_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to update task', 'DB_ERROR');
END tasks_update;
/
```

### DELETE /tasks/:id

```sql
CREATE OR REPLACE PROCEDURE tasks_delete(
  p_id VARCHAR2,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM tasks WHERE id = p_id;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Task not found', 'NOT_FOUND');
    RETURN;
  END IF;

  DELETE FROM tasks WHERE id = p_id;
  COMMIT;

  p_response := '{"message":"Task deleted successfully"}';

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to delete task', 'DB_ERROR');
END tasks_delete;
/
```

---

## Manager Handlers

### GET /managers

```sql
CREATE OR REPLACE PROCEDURE managers_list(
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id' VALUE id,
      'name' VALUE name,
      'username' VALUE username,
      'password' VALUE password,
      'avatarUrl' VALUE avatar_url,
      'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
      'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
    )
  ).getclobval() INTO p_response
  FROM managers;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch managers', 'DB_ERROR');
END managers_list;
/
```

### GET /managers/:id

```sql
CREATE OR REPLACE PROCEDURE managers_get_by_id(
  p_id VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM managers
  WHERE id = p_id;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_response := content_platform_utils.json_error('Manager not found', 'NOT_FOUND');
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch manager', 'DB_ERROR');
END managers_get_by_id;
/
```

### GET /managers/username/:username

```sql
CREATE OR REPLACE PROCEDURE managers_get_by_username(
  p_username VARCHAR2,
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM managers
  WHERE LOWER(username) = LOWER(p_username);

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    p_response := content_platform_utils.json_error('Manager not found', 'NOT_FOUND');
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch manager', 'DB_ERROR');
END managers_get_by_username;
/
```

### POST /managers

```sql
CREATE OR REPLACE PROCEDURE managers_create(
  p_name VARCHAR2,
  p_username VARCHAR2,
  p_password VARCHAR2,
  p_avatar_url VARCHAR2 DEFAULT NULL,
  p_response OUT CLOB
) AS
  v_id VARCHAR2(100);
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM managers WHERE LOWER(username) = LOWER(p_username);
  IF v_exists > 0 THEN
    p_response := content_platform_utils.json_error('Username already exists', 'DUPLICATE_USERNAME');
    RETURN;
  END IF;

  v_id := content_platform_utils.generate_id('manager');

  INSERT INTO managers (
    id, name, username, password, avatar_url, created_at, updated_at
  ) VALUES (
    v_id,
    p_name,
    p_username,
    p_password,
    p_avatar_url,
    SYSTIMESTAMP,
    SYSTIMESTAMP
  );
  COMMIT;

  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM managers
  WHERE id = v_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to create manager', 'DB_ERROR');
END managers_create;
/
```

### PUT /managers/:id

```sql
CREATE OR REPLACE PROCEDURE managers_update(
  p_id VARCHAR2,
  p_name VARCHAR2 DEFAULT NULL,
  p_username VARCHAR2 DEFAULT NULL,
  p_password VARCHAR2 DEFAULT NULL,
  p_avatar_url VARCHAR2 DEFAULT NULL,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM managers WHERE id = p_id;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Manager not found', 'NOT_FOUND');
    RETURN;
  END IF;

  UPDATE managers SET
    name = NVL(p_name, name),
    username = NVL(p_username, username),
    password = NVL(p_password, password),
    avatar_url = NVL(p_avatar_url, avatar_url),
    updated_at = SYSTIMESTAMP
  WHERE id = p_id;
  COMMIT;

  SELECT JSON_OBJECT(
    'id' VALUE id,
    'name' VALUE name,
    'username' VALUE username,
    'password' VALUE password,
    'avatarUrl' VALUE avatar_url,
    'createdAt' VALUE TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF'),
    'updatedAt' VALUE TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SSXFF')
  ).getclobval() INTO p_response
  FROM managers
  WHERE id = p_id;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to update manager', 'DB_ERROR');
END managers_update;
/
```

### DELETE /managers/:id

```sql
CREATE OR REPLACE PROCEDURE managers_delete(
  p_id VARCHAR2,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM managers WHERE id = p_id;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Manager not found', 'NOT_FOUND');
    RETURN;
  END IF;

  DELETE FROM managers WHERE id = p_id;
  COMMIT;

  p_response := '{"message":"Manager deleted successfully"}';

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to delete manager', 'DB_ERROR');
END managers_delete;
/
```

---

## Brand Handlers

### GET /brands

```sql
CREATE OR REPLACE PROCEDURE brands_list(
  p_response OUT CLOB
) AS
BEGIN
  SELECT JSON_ARRAYAGG(
    brand_name
  ).getclobval() INTO p_response
  FROM brands
  ORDER BY brand_name;

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to fetch brands', 'DB_ERROR');
END brands_list;
/
```

### POST /brands/initialize

```sql
CREATE OR REPLACE PROCEDURE brands_initialize(
  p_response OUT CLOB
) AS
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM brands;
  IF v_count = 0 THEN
    INSERT INTO brands (brand_name) VALUES ('Nike');
    INSERT INTO brands (brand_name) VALUES ('Adidas');
    INSERT INTO brands (brand_name) VALUES ('Puma');
    INSERT INTO brands (brand_name) VALUES ('Reebok');
    INSERT INTO brands (brand_name) VALUES ('New Balance');
    INSERT INTO brands (brand_name) VALUES ('Asics');
    INSERT INTO brands (brand_name) VALUES ('Saucony');
    INSERT INTO brands (brand_name) VALUES ('HOKA');
    COMMIT;
  END IF;

  p_response := '{"message":"Brands initialized"}';

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to initialize brands', 'DB_ERROR');
END brands_initialize;
/
```

### POST /brands

```sql
CREATE OR REPLACE PROCEDURE brands_add(
  p_brand VARCHAR2,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM brands WHERE LOWER(brand_name) = LOWER(p_brand);
  IF v_exists > 0 THEN
    p_response := content_platform_utils.json_error('Brand already exists', 'DUPLICATE_BRAND');
    RETURN;
  END IF;

  INSERT INTO brands (brand_name) VALUES (p_brand);
  COMMIT;

  p_response := '{"message":"Brand added","brand":"' || p_brand || '"}';

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to add brand', 'DB_ERROR');
END brands_add;
/
```

### DELETE /brands/:brand

```sql
CREATE OR REPLACE PROCEDURE brands_delete(
  p_brand VARCHAR2,
  p_response OUT CLOB
) AS
  v_exists NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM brands WHERE brand_name = p_brand;
  IF v_exists = 0 THEN
    p_response := content_platform_utils.json_error('Brand not found', 'NOT_FOUND');
    RETURN;
  END IF;

  DELETE FROM brands WHERE brand_name = p_brand;
  COMMIT;

  p_response := '{"message":"Brand deleted successfully"}';

EXCEPTION
  WHEN OTHERS THEN
    p_response := content_platform_utils.json_error('Failed to delete brand', 'DB_ERROR');
END brands_delete;
/
```

---

## Error Handling Utilities

### Setup Error Logging Table (Optional)

```sql
CREATE TABLE error_logs (
  log_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  error_message VARCHAR2(1000),
  error_stack CLOB,
  endpoint VARCHAR2(255),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE OR REPLACE PROCEDURE log_error(
  p_endpoint VARCHAR2,
  p_error_message VARCHAR2,
  p_error_stack CLOB
) AS
BEGIN
  INSERT INTO error_logs (endpoint, error_message, error_stack)
  VALUES (p_endpoint, p_error_message, p_error_stack);
  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Silently fail to avoid recursive errors
END log_error;
/
```

---

## Oracle APEX REST Module Setup

After creating the procedures, you need to set up REST modules in APEX:

### Steps to Create REST Modules in APEX:

1. **Go to SQL Workshop → RESTful Services**
2. **Create Module:**
   - Module: `content-platform`
   - Base Path: `/content-platform`
   - Protected by: Oracle Application Express Users (or your custom auth)

3. **Create Templates for Each Resource:**

```
/auth
/auth/login     [POST]
/auth/logout    [POST]
/auth/session   [GET]

/creators
/creators       [GET, POST]
/creators/{id}  [GET, PUT, DELETE]
/creators/username/{username} [GET]

/tasks
/tasks          [GET, POST]
/tasks/{id}     [GET, PUT, DELETE]
/tasks/date/{date}     [GET]
/tasks/creator/{creatorId} [GET]

/managers
/managers       [GET, POST]
/managers/{id}  [GET, PUT, DELETE]
/managers/username/{username} [GET]

/brands
/brands         [GET]
/brands/initialize [POST]
/brands         [POST]
/brands/{brand} [DELETE]
```

4. **For Each Template/Handler:**
   - Create a Handler (PL/SQL)
   - Call the corresponding procedure
   - Set response MIME type to `application/json`

### Example Handler (POST /auth/login):

```sql
DECLARE
  v_response CLOB;
BEGIN
  auth_login(
    p_username => :username,
    p_password => :password,
    p_response => v_response
  );
  
  HTP.print(v_response);
END;
/
```

---

## Important Notes

1. **Password Hashing**: The current implementation doesn't hash passwords. Use proper hashing (bcrypt, Argon2) in production!

2. **Token Security**: Implement proper JWT or session management. Current implementation uses simple tokens.

3. **CORS**: Configure CORS headers in APEX to allow cross-origin requests from your frontend.

4. **Input Validation**: Add more robust input validation before inserting into database.

5. **Parameterized Queries**: Use bind variables to prevent SQL injection.

6. **Error Codes**: Return appropriate HTTP status codes (200, 201, 400, 401, 404, 500).

7. **Testing**: Test each procedure individually in SQL Developer before exposing via REST.

8. **Performance**: Add indexes for frequently queried columns (done in schema).

---

## Testing Script

```sql
-- Test Creator creation
DECLARE
  v_response CLOB;
BEGIN
  creators_create(
    p_name => 'Test Creator',
    p_username => 'testcreator',
    p_password => 'password123',
    p_brands => '["Nike","Adidas"]',
    p_response => v_response
  );
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/

-- Test Creator list
DECLARE
  v_response CLOB;
BEGIN
  creators_list(v_response);
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/

-- Test Login
DECLARE
  v_response CLOB;
BEGIN
  auth_login(
    p_username => 'testcreator',
    p_password => 'password123',
    p_response => v_response
  );
  DBMS_OUTPUT.PUT_LINE(v_response);
END;
/
```

Execute these in SQL Developer or SQL*Plus to verify procedures work correctly before deploying to APEX.
