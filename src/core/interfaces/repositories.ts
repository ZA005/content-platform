import type { AuthUser, Creator, ID, Manager, Session, Task } from "@/core/types";

/**
 * Contract for authentication persistence. Swap the LocalStorage
 * implementation for an ApiAuthRepository later without touching
 * any feature code — everything depends on this interface only.
 */
export interface AuthRepository {
  login(username: string, password: string): Promise<AuthUser>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
}

export interface CreateCreatorInput {
  name: string;
  username: string;
  password: string;
  brands: string[];
  avatarUrl?: string;
}

export interface UpdateCreatorInput {
  name?: string;
  username?: string;
  password?: string;
  brands?: string[];
  status?: Creator["status"];
  avatarUrl?: string;
}

export interface CreatorRepository {
  list(): Promise<Creator[]>;
  getById(id: ID): Promise<Creator | null>;
  getByUsername(username: string): Promise<Creator | null>;
  create(input: CreateCreatorInput): Promise<Creator>;
  update(id: ID, input: UpdateCreatorInput): Promise<Creator>;
  disable(id: ID): Promise<Creator>;
  enable(id: ID): Promise<Creator>;
  delete(id: ID): Promise<void>;
}

export interface CreateTaskInput {
  creatorId: string;
  brand: string;
  scheduledDate: string;
  scriptLink: string;
  instruction: string;
  notes: string;
  status?: Task["status"];
  referenceLink?: string;
}

export interface UpdateTaskInput {
  creatorId?: string;
  brand?: string;
  scheduledDate?: string;
  scriptLink?: string;
  instruction?: string;
  notes?: string;
  referenceLink?: string;
  status?: Task["status"];
}

export interface TaskRepository {
  list(): Promise<Task[]>;
  getById(id: ID): Promise<Task | null>;
  listByDate(date: string): Promise<Task[]>;
  listByCreator(creatorId: string): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: ID, input: UpdateTaskInput): Promise<Task>;
  delete(id: ID): Promise<void>;
}

export interface CreateManagerInput {
  name: string;
  username: string;
  password: string;
  avatarUrl?: string;
}

export interface UpdateManagerInput {
  name?: string;
  username?: string;
  password?: string;
  avatarUrl?: string;
}

export interface ManagerRepository {
  list(): Promise<Manager[]>;
  getById(id: ID): Promise<Manager | null>;
  getByUsername(username: string): Promise<Manager | null>;
  create(input: CreateManagerInput): Promise<Manager>;
  update(id: ID, input: UpdateManagerInput): Promise<Manager>;
  delete(id: ID): Promise<void>;
}

export interface BrandRepository {
  list(): Promise<string[]>;
  add(name: string): Promise<void>;
  remove(name: string): Promise<void>;
}

/**
 * Reserved for future multi-admin support — not wired into the UI yet,
 * but keeping the interface in place documents where that logic will land.
 */
export interface UserRepository {
  list(): Promise<AuthUser[]>;
  getById(id: ID): Promise<AuthUser | null>;
}
