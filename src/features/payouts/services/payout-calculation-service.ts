import { eachDayOfInterval, endOfMonth, getDay, startOfMonth } from "date-fns";
import type { CreatorRepository, TaskRepository } from "@/core/interfaces/repositories";
import type { Task } from "@/core/types";
import { TASK_STATUS, USER_ROLE } from "@/core/constants";
import {
  calculateCreatorMonthlyPayout,
  calculateDailyPayout,
  calculateManagerMonthlyPayout,
  isDayOff,
  resolvePayoutDate,
  type CreatorMonthlyPayoutInput,
  type ManagerMonthlyPayoutInput,
} from "@/features/payouts/domain/payout-calculator";
import { payoutConfigurationService } from "./payout-configuration-service";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import type { MonthlyPayoutSummary, DailyPayout } from "@/core/types";

export class PayoutCalculationService {
  #taskRepository: TaskRepository;
  #creatorRepository: CreatorRepository;

  constructor(
    taskRepository: TaskRepository,
    creatorRepository: CreatorRepository,
  ) {
    this.#taskRepository = taskRepository;
    this.#creatorRepository = creatorRepository;
  }

  async #getCompletedTasksForCreator(
    creatorId: string,
    month: string
  ): Promise<Task[]> {
    const allTasks = await this.#taskRepository.listByCreator(creatorId);
    const [year, monthStr] = month.split("-");
    const startDate = new Date(`${year}-${monthStr}-01`);
    const endDate = endOfMonth(startDate);

    return allTasks.filter((task) => {
      const taskDate = new Date(task.scheduledDate);
      return (
        task.status === TASK_STATUS.COMPLETED &&
        taskDate >= startDate &&
        taskDate <= endDate
      );
    });
  }

  async #calculateCreatorDailyPayouts(
    creatorId: string,
    month: string,
  ): Promise<DailyPayout[]> {
    const tasks = await this.#getCompletedTasksForCreator(creatorId, month);
    const compensation = await payoutConfigurationService.resolveCompensationForUser(
      creatorId,
      USER_ROLE.CREATOR
    );
    const schedule = await payoutConfigurationService.resolveWorkScheduleForUser(creatorId);
    const config = await payoutConfigurationService.getConfiguration();

    if (!compensation.isConfigured) {
      return [];
    }

    const dailyBaseSalaryCentavos = Math.round(compensation.baseSalaryCentavos / 30);

    const dailyPayouts: Map<string, DailyPayout> = new Map();

    for (const task of tasks) {
      const date = task.scheduledDate;
      const isOffDay = isDayOff(date, schedule);
      const regularTasks = isOffDay ? 0 : 1;
      const dayOffTasks = isOffDay ? 1 : 0;

      const existing = dailyPayouts.get(date);
      if (existing) {
        existing.deliveredTasks += 1;
        existing.regularTasks += regularTasks;
        existing.dayOffTasks += dayOffTasks;
      } else {
        const dailyPayout = calculateDailyPayout({
          date,
          role: USER_ROLE.CREATOR,
          userId: creatorId,
          regularTaskCount: regularTasks,
          dayOffTaskCount: dayOffTasks,
          dailyBaseSalaryCentavos,
          dayOffMultiplier: compensation.dayOffMultiplier ?? config.defaultDayOffMultiplier,
          isDayOff: isOffDay,
        });
        dailyPayouts.set(date, dailyPayout);
      }
    }

    return Array.from(dailyPayouts.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async calculateCreatorMonthlyPayout(
    creatorId: string,
    month: string
  ): Promise<MonthlyPayoutSummary> {
    const compensation = await payoutConfigurationService.resolveCompensationForUser(
      creatorId,
      USER_ROLE.CREATOR
    );
    const config = await payoutConfigurationService.getConfiguration();
    const dailyPayouts = await this.#calculateCreatorDailyPayouts(creatorId, month);

    const [year, monthStr] = month.split("-");
    const payoutDate = resolvePayoutDate(
      parseInt(year),
      parseInt(monthStr),
      config.payoutDayOfMonth
    );

    const input: CreatorMonthlyPayoutInput = {
      month,
      userId: creatorId,
      baseSalaryCentavos: compensation.baseSalaryCentavos,
      dayOffMultiplier: compensation.dayOffMultiplier ?? config.defaultDayOffMultiplier,
      payoutDate,
      dailyPayouts,
    };

    return calculateCreatorMonthlyPayout(input);
  }

  #countWorkingDaysInMonth(month: string, workingDays: number[]): number {
    const [year, monthStr] = month.split("-");
    const startDate = startOfMonth(new Date(`${year}-${monthStr}-01`));
    const endDate = endOfMonth(startDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.filter((d) => workingDays.includes(getDay(d))).length;
  }

  async calculateManagerMonthlyPayout(
    managerId: string,
    month: string
  ): Promise<MonthlyPayoutSummary> {
    const compensation = await payoutConfigurationService.resolveCompensationForUser(
      managerId,
      USER_ROLE.MANAGER
    );
    const config = await payoutConfigurationService.getConfiguration();
    const schedule = await payoutConfigurationService.resolveWorkScheduleForUser(managerId);

    if (!compensation.isConfigured) {
      return {
        month,
        userId: managerId,
        role: USER_ROLE.MANAGER,
        deliveredTasks: 0,
        regularTasks: 0,
        dayOffTasks: 0,
        baseSalaryCentavos: 0,
        regularPayoutCentavos: 0,
        dayOffPayoutCentavos: 0,
        totalPayoutCentavos: 0,
        payoutDate: resolvePayoutDate(
          parseInt(month.split("-")[0]),
          parseInt(month.split("-")[1]),
          config.payoutDayOfMonth
        ),
        finalized: false,
      };
    }

    const workingDays = schedule?.workingDays ?? config.defaultWorkingDays;
    const workingDaysInMonth = this.#countWorkingDaysInMonth(month, workingDays);

    const [year, monthStr] = month.split("-");
    const payoutDate = resolvePayoutDate(
      parseInt(year),
      parseInt(monthStr),
      config.payoutDayOfMonth
    );

    const input: ManagerMonthlyPayoutInput = {
      month,
      userId: managerId,
      baseSalaryCentavos: compensation.baseSalaryCentavos,
      payoutDate,
      workingDaysCount: workingDaysInMonth,
    };

    return calculateManagerMonthlyPayout(input);
  }

  async calculateMonthlyPayouts(month: string): Promise<MonthlyPayoutSummary[]> {
    const creators = await this.#creatorRepository.list();
    const creatorPayouts = await Promise.all(
      creators
        .filter((c) => c.status === "active")
        .map((c) => this.calculateCreatorMonthlyPayout(c.id, month))
    );

    return creatorPayouts;
  }
}

export const payoutCalculationService = new PayoutCalculationService(
  repositoryFactory.getTaskRepository(),
  repositoryFactory.getCreatorRepository()
);
