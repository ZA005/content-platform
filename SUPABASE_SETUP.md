# Supabase Setup Guide

Complete step-by-step instructions for setting up Supabase for the Content Production Tracker platform.

**Project ID:** `ofagpnibapoyfkikddvh`  
**Project URL:** `https://ofagpnibapoyfkikddvh.supabase.co`

---

## Table of Contents

1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Database Schema](#database-schema)
4. [Authentication Setup](#authentication-setup)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Edge Functions](#edge-functions)
7. [Frontend Integration](#frontend-integration)
8. [Testing & Verification](#testing--verification)

---

## Overview

The Content Production Tracker is a role-based management system with three user roles:

- **Admin:** Full system control, can create managers and creators
- **Manager:** Can create creators and manage their tasks
- **Creator:** Can view and complete assigned tasks

### Tech Stack

- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (email/password)
- **Frontend:** React 19 + TypeScript + Vite
- **API:** Supabase REST API + Edge Functions
- **Security:** Row Level Security (RLS) policies

---

## Initial Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click **New Project**
4. Fill in project details:
   - **Name:** `content-platform` (or your preference)
   - **Database Password:** Generate a strong password
   - **Region:** Select closest to your users
   - **Pricing Plan:** Choose based on usage needs
5. Wait for project to initialize (5-10 minutes)

### 2. Get Project Credentials

Once initialized:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://ofagpnibapoyfkikddvh.supabase.co`)
   - **anon public key** (read-only, safe for frontend)
   - **service_role key** (secret, for backend only)

### 3. Configure Environment Variables

Create `.env.local` in project root:

```env
VITE_REPOSITORY_MODE=supabase
VITE_SUPABASE_URL=https://ofagpnibapoyfkikddvh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Security:** Never commit `.env.local` to git. Add to `.gitignore`.

---

## Database Schema

### 1. Create Tables

Execute the following SQL in Supabase SQL Editor (**SQL** → **New Query**):

#### Brands Table

```sql
CREATE TABLE IF NOT EXISTS brands (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO brands (name) VALUES
  ('Brand A'),
  ('Brand B')
ON CONFLICT DO NOTHING;

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
```

#### Profiles Table

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'creator', 'manager')) NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES creators(id),
  manager_id UUID REFERENCES managers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

#### Creators Table

```sql
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
  brands TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
```

#### Managers Table

```sql
CREATE TABLE IF NOT EXISTS managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
```

#### Tasks Table

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id),
  brand TEXT NOT NULL REFERENCES brands(name),
  scheduled_date DATE NOT NULL,
  script_link TEXT NOT NULL,
  reference_link TEXT,
  instruction TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'in_review', 'completed', 'overdue')) DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### 2. Create Login Helper Function

This function resolves username to email for authentication:

```sql
CREATE OR REPLACE FUNCTION resolve_login_email(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE raw_user_meta_data->>'username' = LOWER(TRIM(p_username));
  
  RETURN COALESCE(v_email, 'nonexistent@users.contentplatform.internal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Authentication Setup

### 1. Create Admin User

In Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - **Email:** `admin@users.contentplatform.internal`
   - **Password:** (strong password)
   - Check **Auto Confirm User**
4. Create the user

### 2. Create Admin Profile

In SQL Editor, execute:

```sql
INSERT INTO profiles (id, role, name, username)
SELECT 
  id,
  'admin',
  'Administrator',
  'admin'
FROM auth.users
WHERE raw_user_meta_data->>'username' = 'admin'
ON CONFLICT DO NOTHING;
```

### 3. Additional Users

Create managers and creators through the app's UI:

1. Log in as **admin** (username: `admin`)
2. Go to **Managers** tab → **Add Manager**
3. Go to **Creators** tab → **Add Creator**

The edge function handles atomic creation of auth users + database records.

---

## Row Level Security (RLS)

RLS policies control who can access which data. Enable and configure for each table:

### 1. Brands Table (All Authenticated Users Can Read)

```sql
CREATE POLICY brands_select_all ON brands
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
```

### 2. Profiles Table

```sql
-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 3. Managers Table

```sql
-- Managers can read their own record
CREATE POLICY managers_select_own ON managers
  FOR SELECT USING (
    id IN (
      SELECT manager_id FROM profiles WHERE id = auth.uid() AND manager_id IS NOT NULL
    )
  );

-- Admins can read all managers
CREATE POLICY managers_admin_read ON managers
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
```

### 4. Creators Table

```sql
-- Creators can read their own record
CREATE POLICY creators_select_own ON creators
  FOR SELECT USING (
    id IN (
      SELECT creator_id FROM profiles WHERE id = auth.uid() AND creator_id IS NOT NULL
    )
  );

-- Admins can read all creators
CREATE POLICY creators_admin_read ON creators
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Managers can read all creators
CREATE POLICY creators_manager_read ON creators
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
  );

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
```

### 5. Tasks Table

```sql
-- Creators can read their own tasks
CREATE POLICY tasks_select_own ON tasks
  FOR SELECT USING (
    creator_id IN (
      SELECT creator_id FROM profiles WHERE id = auth.uid() AND creator_id IS NOT NULL
    )
  );

-- Creators can update their own tasks
CREATE POLICY tasks_update_own ON tasks
  FOR UPDATE USING (
    creator_id IN (
      SELECT creator_id FROM profiles WHERE id = auth.uid() AND creator_id IS NOT NULL
    )
  )
  WITH CHECK (
    creator_id IN (
      SELECT creator_id FROM profiles WHERE id = auth.uid() AND creator_id IS NOT NULL
    )
  );

-- Admins can read all tasks
CREATE POLICY tasks_admin_read ON tasks
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can insert tasks (for manager on behalf of creator)
CREATE POLICY tasks_admin_insert ON tasks
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Managers can insert tasks (create for creators)
CREATE POLICY tasks_manager_insert ON tasks
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager'
  );

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### Verify Policies

Check all policies are enabled:

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Edge Functions

Edge Functions handle server-side operations like user creation with proper authorization.

### 1. Deploy admin-manage-user Function

Create file: `supabase/functions/admin-manage-user/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminManageUserRequest {
  action: "create" | "updateCredentials" | "delete";
  entity: "creator" | "manager";
  id?: string;
  name?: string;
  username?: string;
  password?: string;
  brands?: string[];
  avatarUrl?: string;
  newUsername?: string;
  newPassword?: string;
}

interface AdminManageUserResponse {
  data?: any;
  error?: string;
}

function synthesizeEmail(username: string): string {
  return `${username.toLowerCase()}@users.contentplatform.internal`;
}

async function handleCreate(
  req: AdminManageUserRequest,
  supabaseUrl: string,
  adminClient: any,
  userRole: string,
): Promise<AdminManageUserResponse> {
  const role = userRole.toLowerCase();

  // Admins can create managers and creators
  // Managers can create creators only
  if (req.entity === "manager" && role !== "admin") {
    return { error: "Only admins can create manager accounts" };
  }

  if (role !== "admin" && role !== "manager") {
    return { error: `Only admins and managers can create users. Your role: ${userRole || "unknown"}` };
  }

  if (!req.name || !req.username || !req.password || !req.entity) {
    return { error: "Missing required fields: name, username, password, entity" };
  }

  const email = synthesizeEmail(req.username);

  // Check username uniqueness
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", req.username)
    .single();

  if (existingProfile) {
    return { error: "This username is already taken" };
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: req.password,
      email_confirm: true,
      user_metadata: {
        username: req.username,
        role: req.entity,
        name: req.name,
      },
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Failed to create auth user" };
    }

    const userId = authData.user.id;

    // Create creators/managers row
    let entityId: string | null = null;

    if (req.entity === "creator") {
      const { data: creatorData, error: creatorError } = await adminClient
        .from("creators")
        .insert({
          name: req.name,
          username: req.username,
          status: "active",
          brands: req.brands || [],
          avatar_url: req.avatarUrl || null,
        })
        .select()
        .single();

      if (creatorError) {
        await adminClient.auth.admin.deleteUser(userId);
        return { error: creatorError.message };
      }
      entityId = creatorData.id;
    } else if (req.entity === "manager") {
      const { data: managerData, error: managerError } = await adminClient
        .from("managers")
        .insert({
          name: req.name,
          username: req.username,
          avatar_url: req.avatarUrl || null,
        })
        .select()
        .single();

      if (managerError) {
        await adminClient.auth.admin.deleteUser(userId);
        return { error: managerError.message };
      }
      entityId = managerData.id;
    }

    // Create profiles row
    const profileData = {
      id: userId,
      role: req.entity,
      name: req.name,
      username: req.username,
      creator_id: req.entity === "creator" ? entityId : null,
      manager_id: req.entity === "manager" ? entityId : null,
    };

    const { error: profileError } = await adminClient.from("profiles").insert(profileData);

    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      if (req.entity === "creator") {
        await adminClient.from("creators").delete().eq("id", entityId);
      } else {
        await adminClient.from("managers").delete().eq("id", entityId);
      }
      return { error: profileError.message };
    }

    // Return the created entity data
    if (req.entity === "creator") {
      const { data: creatorData } = await adminClient
        .from("creators")
        .select("*")
        .eq("id", entityId)
        .single();
      return {
        data: {
          id: creatorData.id,
          name: creatorData.name,
          username: creatorData.username,
          password: "",
          status: creatorData.status,
          brands: creatorData.brands,
          avatarUrl: creatorData.avatar_url || "",
          createdAt: creatorData.created_at,
          updatedAt: creatorData.updated_at,
        },
      };
    } else {
      const { data: managerData } = await adminClient
        .from("managers")
        .select("*")
        .eq("id", entityId)
        .single();
      return {
        data: {
          id: managerData.id,
          name: managerData.name,
          username: managerData.username,
          password: "",
          avatarUrl: managerData.avatar_url || "",
          createdAt: managerData.created_at,
          updatedAt: managerData.updated_at,
        },
      };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function handleUpdateCredentials(
  req: AdminManageUserRequest,
  adminClient: any,
  userRole: string,
): Promise<AdminManageUserResponse> {
  if (userRole !== "admin") {
    return { error: "Only admins can update credentials" };
  }

  if (!req.id || !req.entity) {
    return { error: "Missing required fields: id, entity" };
  }

  if (!req.newUsername && !req.newPassword) {
    return { error: "Provide at least one of: newUsername, newPassword" };
  }

  try {
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .select("id, creator_id, manager_id")
      .eq(req.entity === "creator" ? "creator_id" : "manager_id", req.id)
      .single();

    if (profileError || !profileData) {
      return { error: "User not found" };
    }

    const userId = profileData.id;
    const updateData: Record<string, any> = {};

    if (req.newUsername) {
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", req.newUsername)
        .single();

      if (existing) {
        return { error: "This username is already taken" };
      }

      updateData.username = req.newUsername;
      updateData.email = synthesizeEmail(req.newUsername);
    }

    if (req.newPassword) {
      updateData.password = req.newPassword;
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, updateData);

    if (authError) {
      return { error: authError.message };
    }

    if (req.newUsername) {
      const { error: profileUpdateError } = await adminClient
        .from("profiles")
        .update({ username: req.newUsername })
        .eq("id", userId);

      if (profileUpdateError) {
        return { error: profileUpdateError.message };
      }

      const tableToUpdate = req.entity === "creator" ? "creators" : "managers";
      const { error: entityUpdateError } = await adminClient
        .from(tableToUpdate)
        .update({ username: req.newUsername })
        .eq("id", req.id);

      if (entityUpdateError) {
        return { error: entityUpdateError.message };
      }
    }

    const tableToSelect = req.entity === "creator" ? "creators" : "managers";
    const { data: entityData } = await adminClient
      .from(tableToSelect)
      .select("*")
      .eq("id", req.id)
      .single();

    if (req.entity === "creator") {
      return {
        data: {
          id: entityData.id,
          name: entityData.name,
          username: entityData.username,
          password: "",
          status: entityData.status,
          brands: entityData.brands,
          avatarUrl: entityData.avatar_url || "",
          createdAt: entityData.created_at,
          updatedAt: entityData.updated_at,
        },
      };
    } else {
      return {
        data: {
          id: entityData.id,
          name: entityData.name,
          username: entityData.username,
          password: "",
          avatarUrl: entityData.avatar_url || "",
          createdAt: entityData.created_at,
          updatedAt: entityData.updated_at,
        },
      };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function handleDelete(
  req: AdminManageUserRequest,
  adminClient: any,
  userRole: string,
): Promise<AdminManageUserResponse> {
  if (userRole !== "admin") {
    return { error: "Only admins can delete users" };
  }

  if (!req.id || !req.entity) {
    return { error: "Missing required fields: id, entity" };
  }

  try {
    const { data: profileData, error: profileError } = await adminClient
      .from("profiles")
      .select("id, creator_id, manager_id")
      .eq(req.entity === "creator" ? "creator_id" : "manager_id", req.id)
      .single();

    if (profileError || !profileData) {
      return { error: "User not found" };
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(profileData.id);

    if (authError) {
      return { error: authError.message };
    }

    const tableToDelete = req.entity === "creator" ? "creators" : "managers";
    const { error: entityError } = await adminClient
      .from(tableToDelete)
      .delete()
      .eq("id", req.id);

    if (entityError) {
      return { error: entityError.message };
    }

    return { data: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: `Failed to load profile: ${profileError.message}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRole = callerProfile.role ? String(callerProfile.role).trim() : "";

    const body: AdminManageUserRequest = await req.json();

    let response: AdminManageUserResponse;

    if (body.action === "create") {
      response = await handleCreate(body, supabaseUrl, adminClient, userRole);
    } else if (body.action === "updateCredentials") {
      response = await handleUpdateCredentials(body, adminClient, userRole);
    } else if (body.action === "delete") {
      response = await handleDelete(body, adminClient, userRole);
    } else {
      response = { error: "Invalid action" };
    }

    const statusCode = response.error ? 400 : 200;

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
```

### 2. Deploy Function

```bash
supabase functions deploy admin-manage-user
```

Or via Supabase Dashboard: **Functions** → Upload function → Select `admin-manage-user/index.ts`

---

## Frontend Integration

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Initialize Supabase Client

Create `src/infrastructure/supabase/supabase-client.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase configuration in environment variables");
}

export const getSupabaseClient = () => createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Create Repository Layer

Repositories handle data access with proper type safety and error handling:

**Creator Repository:** `src/infrastructure/repositories/supabase-creator-repository.ts`

```typescript
import type { CreateCreatorInput, CreatorRepository, UpdateCreatorInput } from "@/core/interfaces/repositories";
import { CREATOR_STATUS } from "@/core/constants";
import type { Creator, ID } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

export class SupabaseCreatorRepository implements CreatorRepository {
  async list(): Promise<Creator[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("creators").select("*").order("name", { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToCreator);
  }

  async create(input: CreateCreatorInput): Promise<Creator> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke("admin-manage-user", {
      body: {
        action: "create",
        entity: "creator",
        name: input.name,
        username: input.username,
        password: input.password,
        brands: input.brands || [],
        avatarUrl: input.avatarUrl || null,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return {
      id: data.data.id,
      name: data.data.name,
      username: data.data.username,
      password: "",
      status: data.data.status,
      brands: data.data.brands || [],
      avatarUrl: data.data.avatarUrl || "",
      createdAt: data.data.createdAt,
      updatedAt: data.data.updatedAt,
    };
  }

  async update(id: ID, input: UpdateCreatorInput): Promise<Creator> {
    const supabase = getSupabaseClient();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.username !== undefined) updateData.username = input.username.toLowerCase().trim();
    if (input.brands !== undefined) updateData.brands = input.brands;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl || null;

    const { data, error } = await supabase
      .from("creators")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return rowToCreator(data);
  }

  async disable(id: ID): Promise<Creator> {
    return this.update(id, { status: CREATOR_STATUS.DISABLED });
  }

  async enable(id: ID): Promise<Creator> {
    return this.update(id, { status: CREATOR_STATUS.ACTIVE });
  }

  async delete(id: ID): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("creators").delete().eq("id", id);
    if (error) throw error;
  }
}

function rowToCreator(row: any): Creator {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password: "",
    status: row.status as "active" | "disabled",
    brands: row.brands,
    avatarUrl: row.avatar_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

### 4. Use Custom Hooks

Hooks provide a clean interface for React components:

**useCreators Hook:** `src/features/creators/hooks/use-creators.ts`

```typescript
import { useCallback, useEffect, useState } from "react";
import type { Creator, ID } from "@/core/types";
import { creatorService } from "../services/creator-service";

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCreators(await creatorService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load creators.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createCreator = useCallback(
    async (input: any) => {
      await creatorService.create(input);
      await refetch();
    },
    [refetch],
  );

  const updateCreator = useCallback(
    async (id: ID, input: any) => {
      await creatorService.update(id, input);
      await refetch();
    },
    [refetch],
  );

  const toggleStatus = useCallback(
    async (creator: Creator) => {
      if (creator.status === "active") {
        await creatorService.disable(creator.id);
      } else {
        await creatorService.enable(creator.id);
      }
      await refetch();
    },
    [refetch],
  );

  return { creators, isLoading, error, refetch, createCreator, updateCreator, toggleStatus };
}
```

### 5. Use in Components

```typescript
import { useCreators } from "@/features/creators/hooks/use-creators";

export function ManagerCreatorsPage() {
  const { creators, isLoading, createCreator, updateCreator, toggleStatus } = useCreators();

  return (
    <div>
      {isLoading ? (
        <LoadingState />
      ) : (
        <div>
          {creators.map((creator) => (
            <CreatorRow key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Testing & Verification

### 1. Test Authentication

```bash
# Test admin login
curl -X POST https://ofagpnibapoyfkikddvh.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@users.contentplatform.internal",
    "password": "your_password"
  }'
```

### 2. Verify RLS Policies

Log in as different roles and verify they can only see appropriate data:

- **Admin:** Can see all creators, managers, tasks
- **Manager:** Can see all creators and their own tasks
- **Creator:** Can only see their own tasks and profile

### 3. Test Edge Function

```bash
# Create a creator as a manager
curl -X POST https://ofagpnibapoyfkikddvh.supabase.co/functions/v1/admin-manage-user \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "entity": "creator",
    "name": "John Doe",
    "username": "johndoe",
    "password": "secure_password",
    "brands": ["Brand A"]
  }'
```

### 4. Checklist

- [ ] Supabase project created with correct credentials in `.env.local`
- [ ] All 5 tables created (brands, profiles, managers, creators, tasks)
- [ ] `resolve_login_email` function created
- [ ] RLS enabled on all tables
- [ ] All RLS policies created (verify with `pg_policies` query)
- [ ] Admin user created in auth
- [ ] Admin profile created in database
- [ ] Edge function deployed
- [ ] Frontend `.env.local` configured
- [ ] Dependencies installed (`npm install`)
- [ ] App runs locally (`npm run dev`)
- [ ] Can log in as admin
- [ ] Can create managers as admin
- [ ] Can create creators as manager
- [ ] Managers can see creators list
- [ ] Creators can see their own tasks

---

## Troubleshooting

### RLS Policies Block Queries

**Symptom:** 401 errors, empty data arrays

**Solution:**
1. Verify RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
2. Check policies exist: `SELECT tablename, policyname FROM pg_policies`
3. Test with service role key (bypasses RLS) to confirm data exists
4. Review policy `USING` clause logic

### User Can't Log In

**Symptom:** "Invalid username or password"

**Solution:**
1. Verify user exists in `auth.users`: Check Authentication dashboard
2. Verify user metadata has `username`: Check user's metadata tab
3. Verify profile exists in `profiles` table
4. Run `SELECT * FROM resolve_login_email('username')` to test resolution

### Creating User Fails

**Symptom:** Edge function returns "Only admins can create users"

**Solution:**
1. Verify caller's profile has correct `role`: `SELECT role FROM profiles WHERE id = auth.uid()`
2. Check JWT token is valid and belongs to authenticated user
3. Verify edge function has access to `SUPABASE_SERVICE_ROLE_KEY` env var

### Managers Can't See Creators

**Symptom:** Empty creators list for manager accounts

**Solution:**
1. Verify `creators_manager_read` policy exists
2. Check user's profile role is 'manager'
3. Test with: `SELECT * FROM creators` after logging in as manager
4. If no results, check RLS audit logs in project settings

---

## Security Best Practices

1. **Never commit `.env.local`** — Add to `.gitignore`
2. **Keep service_role key secret** — Only use server-side
3. **Use anon key on frontend** — Safe to expose
4. **RLS is your firewall** — Never rely on frontend validation alone
5. **Audit edge functions** — They have full database access via service role
6. **Rotate credentials regularly** — Regenerate keys quarterly
7. **Monitor logs** — Check function invocations and errors
8. **Test RLS thoroughly** — Verify access control with all role combinations

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
