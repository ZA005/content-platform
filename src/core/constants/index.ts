export const STORAGE_KEYS = {
  SESSION: "ccp:session",
  USERS: "ccp:users",
  CREATORS: "ccp:creators",
  TASKS: "ccp:tasks",
  MANAGERS: "ccp:managers",
  SEED_VERSION: "ccp:seed-version",
} as const;

/**
 * Bump this whenever the shape of seed data changes so returning users
 * on an older localStorage snapshot get the new mock dataset.
 */
export const SEED_VERSION = "1";

export const TASK_STATUS = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  COMPLETED: "completed",
  OVERDUE: "overdue",
} as const;

export const CREATOR_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
} as const;

export const USER_ROLE = {
  ADMIN: "admin",
  CREATOR: "creator",
  MANAGER: "manager",
} as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  [TASK_STATUS.NOT_STARTED]: "Not Started",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.IN_REVIEW]: "In Review",
  [TASK_STATUS.COMPLETED]: "Completed",
  [TASK_STATUS.OVERDUE]: "Overdue",
};

export const APP_NAME = "Reel";

export const STORAGE_KEYS_BRANDS = "ccp:brands";
