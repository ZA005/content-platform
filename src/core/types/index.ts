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
  isDayOff?: boolean; // Manual override: if true, always treated as day-off work
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithCreator extends Task {
  creator: Creator | undefined;
}

export interface PayoutConfiguration {
  payoutDayOfMonth: number;
  defaultDayOffMultiplier: number;
  defaultWorkingDays: number[];
  roleDefaults: {
    creator: { baseSalaryCentavos?: number; dayOffMultiplier?: number };
    manager: { baseSalaryCentavos?: number; dayOffMultiplier?: number };
  };
  updatedAt: string;
}

export interface CompensationProfile {
  id: string;
  userId: string;
  role: Extract<UserRole, "creator" | "manager">;
  baseSalaryCentavos: number;
  dayOffMultiplier?: number;
  effectiveDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSchedule {
  id: string;
  userId: string;
  workingDays: number[];
  customDaysOff: string[];
  updatedAt: string;
}

export interface DailyPayout {
  date: string;
  userId: string;
  role: UserRole;
  deliveredTasks: number;
  regularTasks: number;
  dayOffTasks: number;
  dailyBaseSalaryCentavos: number;
  regularPayoutCentavos: number;
  dayOffPayoutCentavos: number;
  totalPayoutCentavos: number;
  isDayOff: boolean;
}

export interface MonthlyPayoutSummary {
  month: string;
  userId: string;
  role: UserRole;
  deliveredTasks: number;
  regularTasks: number;
  dayOffTasks: number;
  baseSalaryCentavos: number;
  regularPayoutCentavos: number;
  dayOffPayoutCentavos: number;
  totalPayoutCentavos: number;
  payoutDate: string;
  finalized: boolean;
  finalizedAt?: string;
}

export interface FinalizedPayoutRecord {
  summary: MonthlyPayoutSummary;
  dailyBreakdown: DailyPayout[];
}

export type ID = string;
