import { getDaysInMonth } from "date-fns";
import type {
  CompensationProfile,
  DailyPayout,
  MonthlyPayoutSummary,
  UserRole,
  WorkSchedule,
} from "@/core/types";
import { USER_ROLE } from "@/core/constants";

export function calculateDailyBaseSalary(baseSalaryCentavos: number): number {
  return Math.round(baseSalaryCentavos / 30);
}

export function calculateDayOffRate(
  dailyBaseSalaryCentavos: number,
  multiplier: number
): number {
  return Math.round(dailyBaseSalaryCentavos * multiplier);
}

export function calculateRegularPayout(
  dailyBaseSalaryCentavos: number,
  taskCount: number
): number {
  return dailyBaseSalaryCentavos * taskCount;
}

export function calculateDayOffPayout(
  dayOffRateCentavos: number,
  taskCount: number
): number {
  return dayOffRateCentavos * taskCount;
}

export function isDayOff(date: string, schedule: WorkSchedule | null | undefined): boolean {
  if (!schedule) return false;
  const d = new Date(date + "T00:00:00Z");
  const dayOfWeek = d.getUTCDay();
  const isWorkingDay = schedule.workingDays.includes(dayOfWeek);
  const isCustomDayOff = schedule.customDaysOff.includes(date);
  return !isWorkingDay || isCustomDayOff;
}

export interface ResolvedCompensation {
  baseSalaryCentavos: number;
  dayOffMultiplier: number;
  isConfigured: boolean;
}

export function resolveCompensation(
  profile: CompensationProfile | null,
  roleDefault: { baseSalaryCentavos?: number; dayOffMultiplier?: number } | undefined,
  globalMultiplier: number
): ResolvedCompensation {
  const baseSalaryCentavos = profile?.baseSalaryCentavos ?? roleDefault?.baseSalaryCentavos ?? 0;
  const dayOffMultiplier = profile?.dayOffMultiplier ?? roleDefault?.dayOffMultiplier ?? globalMultiplier;

  return {
    baseSalaryCentavos,
    dayOffMultiplier,
    isConfigured: (profile?.baseSalaryCentavos ?? roleDefault?.baseSalaryCentavos) != null,
  };
}

export function resolvePayoutDate(year: number, month: number, dayOfMonth: number): string {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const validDay = Math.min(dayOfMonth, daysInMonth);
  return `${year}-${String(month).padStart(2, "0")}-${String(validDay).padStart(2, "0")}`;
}

export interface DailyPayoutCalculationInput {
  date: string;
  role: UserRole;
  userId: string;
  regularTaskCount: number;
  dayOffTaskCount: number;
  dailyBaseSalaryCentavos: number;
  dayOffMultiplier: number;
  isDayOff: boolean;
}

export function calculateDailyPayout(input: DailyPayoutCalculationInput): DailyPayout {
  const {
    date,
    role,
    userId,
    regularTaskCount,
    dayOffTaskCount,
    dailyBaseSalaryCentavos,
    dayOffMultiplier,
    isDayOff,
  } = input;

  const dayOffRateCentavos = calculateDayOffRate(dailyBaseSalaryCentavos, dayOffMultiplier);
  const regularPayoutCentavos = calculateRegularPayout(dailyBaseSalaryCentavos, regularTaskCount);
  const dayOffPayoutCentavos = calculateDayOffPayout(dayOffRateCentavos, dayOffTaskCount);

  return {
    date,
    userId,
    role,
    deliveredTasks: regularTaskCount + dayOffTaskCount,
    regularTasks: regularTaskCount,
    dayOffTasks: dayOffTaskCount,
    dailyBaseSalaryCentavos,
    regularPayoutCentavos,
    dayOffPayoutCentavos,
    totalPayoutCentavos: regularPayoutCentavos + dayOffPayoutCentavos,
    isDayOff,
  };
}

export interface CreatorMonthlyPayoutInput {
  month: string;
  userId: string;
  baseSalaryCentavos: number;
  dayOffMultiplier: number;
  payoutDate: string;
  dailyPayouts: DailyPayout[];
}

export function calculateCreatorMonthlyPayout(
  input: CreatorMonthlyPayoutInput
): MonthlyPayoutSummary {
  const { month, userId, baseSalaryCentavos, payoutDate, dailyPayouts } = input;

  const regularPayoutCentavos = dailyPayouts.reduce((sum, d) => sum + d.regularPayoutCentavos, 0);
  const dayOffPayoutCentavos = dailyPayouts.reduce((sum, d) => sum + d.dayOffPayoutCentavos, 0);
  const deliveredTasks = dailyPayouts.reduce((sum, d) => sum + d.deliveredTasks, 0);
  const regularTasks = dailyPayouts.reduce((sum, d) => sum + d.regularTasks, 0);
  const dayOffTasks = dailyPayouts.reduce((sum, d) => sum + d.dayOffTasks, 0);

  return {
    month,
    userId,
    role: USER_ROLE.CREATOR,
    deliveredTasks,
    regularTasks,
    dayOffTasks,
    baseSalaryCentavos,
    regularPayoutCentavos,
    dayOffPayoutCentavos,
    totalPayoutCentavos: regularPayoutCentavos + dayOffPayoutCentavos,
    payoutDate,
    finalized: false,
  };
}

export interface ManagerMonthlyPayoutInput {
  month: string;
  userId: string;
  baseSalaryCentavos: number;
  payoutDate: string;
  workingDaysCount: number;
}

export function calculateManagerMonthlyPayout(
  input: ManagerMonthlyPayoutInput
): MonthlyPayoutSummary {
  const { month, userId, baseSalaryCentavos, payoutDate, workingDaysCount } = input;
  const dailyBaseSalaryCentavos = calculateDailyBaseSalary(baseSalaryCentavos);
  const totalPayoutCentavos = dailyBaseSalaryCentavos * workingDaysCount;

  return {
    month,
    userId,
    role: USER_ROLE.MANAGER,
    deliveredTasks: 0,
    regularTasks: workingDaysCount,
    dayOffTasks: 0,
    baseSalaryCentavos,
    regularPayoutCentavos: totalPayoutCentavos,
    dayOffPayoutCentavos: 0,
    totalPayoutCentavos,
    payoutDate,
    finalized: false,
  };
}

export function buildExplanationLines(
  baseSalaryCentavos: number,
  dayOffMultiplier: number,
  regularTasks: number,
  dayOffTasks: number,
  regularPayoutCentavos: number,
  dayOffPayoutCentavos: number,
  totalPayoutCentavos: number,
): string[] {
  const dailyBaseSalaryCentavos = calculateDailyBaseSalary(baseSalaryCentavos);

  const lines: string[] = [];

  lines.push(
    `Your monthly base salary is divided by 30 days. ${formatPayoutAmount(baseSalaryCentavos)} ÷ 30 = ${formatPayoutAmount(dailyBaseSalaryCentavos)} daily base salary`
  );

  if (regularTasks > 0) {
    lines.push(
      `Each delivered task on a regular workday uses the regular daily rate. ${formatPayoutAmount(dailyBaseSalaryCentavos)} × ${regularTasks} tasks = ${formatPayoutAmount(regularPayoutCentavos)}`
    );
  }

  // dayOffMultiplier is always included in the explanation for clarity
  const multiplierNote = dayOffMultiplier !== 1 ? ` (${dayOffMultiplier}x)` : "";

  if (dayOffTasks > 0) {
    lines.push(
      `Tasks completed on a day off use your day-off multiplier${multiplierNote}. ${formatPayoutAmount(dailyBaseSalaryCentavos)} × ${dayOffMultiplier} × ${dayOffTasks} tasks = ${formatPayoutAmount(dayOffPayoutCentavos)}`
    );
  }

  lines.push(
    `Your total payout is: ${formatPayoutAmount(regularPayoutCentavos)} + ${formatPayoutAmount(dayOffPayoutCentavos)} = ${formatPayoutAmount(totalPayoutCentavos)}`
  );

  return lines;
}

function formatPayoutAmount(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
