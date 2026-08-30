import type { CREATOR_STATUS, TASK_STATUS, USER_ROLE } from "@/core/constants";

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
export type CreatorStatus = (typeof CREATOR_STATUS)[keyof typeof CREATOR_STATUS];

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  /** Populated when role === "creator", links back to the Creator record. */
  creatorId?: string;
}

export interface Session {
  user: AuthUser;
  issuedAt: string;
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  password: string;
  status: CreatorStatus;
  brands: string[];
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Manager {
  id: string;
  name: string;
  username: string;
  password: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  creatorId: string;
  scheduledDate: string; // ISO date, yyyy-MM-dd
  scriptLink: string;
  instruction: string;
  notes: string;
  referenceLink?: string;
  brand: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithCreator extends Task {
  creator: Creator | undefined;
}

export type ID = string;
