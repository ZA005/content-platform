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
    const [year, monthStr] = month.split("-");
    const startDateStr = `${year}-${monthStr}-01`;
    const endDateStr = `${year}-${monthStr}-31`;

    const tasks = await this.#taskRepository.listByCreatorAndDateRange(creatorId, startDateStr, endDateStr);
    return tasks.filter((task) => task.status === TASK_STATUS.COMPLETED);
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
      // Use manual isDayOff flag if set, otherwise resolve from schedule
      const isOffDay = task.isDayOff ?? isDayOff(date, schedule);
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
    const monthNum = parseInt(monthStr);
    const yearNum = parseInt(year);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      if (workingDays.includes(date.getDay())) {
        count++;
      }
    }
    return count;
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

  async calculateDailyPayoutsByDate(month: string): Promise<Map<string, any[]>> {
    const creators = await this.#creatorRepository.list();
    const config = await payoutConfigurationService.getConfiguration();
    const dailyMap = new Map<string, any[]>();

    for (const creator of creators) {
      if (creator.status !== "active") continue;

      const tasks = await this.#getCompletedTasksForCreator(creator.id, month);
      const compensation = await payoutConfigurationService.resolveCompensationForUser(
        creator.id,
        USER_ROLE.CREATOR
      );

      if (!compensation.isConfigured) {
        continue;
      }

      const schedule = await payoutConfigurationService.resolveWorkScheduleForUser(creator.id);
      const dailyBaseSalaryCentavos = Math.round(compensation.baseSalaryCentavos / 30);

      // Group tasks by date
      const tasksByDate = new Map<string, Task[]>();
      for (const task of tasks) {
        if (!tasksByDate.has(task.scheduledDate)) {
          tasksByDate.set(task.scheduledDate, []);
        }
        tasksByDate.get(task.scheduledDate)!.push(task);
      }

      // Calculate daily payout for each date
      for (const [date, dateTasks] of tasksByDate) {
        if (!dailyMap.has(date)) {
          dailyMap.set(date, []);
        }

        let regularTasks = 0;
        let dayOffTasks = 0;

        for (const task of dateTasks) {
          const isOffDay = task.isDayOff ?? isDayOff(date, schedule);
          if (isOffDay) {
            dayOffTasks++;
          } else {
            regularTasks++;
          }
        }

        const dayOffRateCentavos = Math.round(
          dailyBaseSalaryCentavos * (compensation.dayOffMultiplier ?? config.defaultDayOffMultiplier)
        );
        const regularPayoutCentavos = dailyBaseSalaryCentavos * regularTasks;
        const dayOffPayoutCentavos = dayOffRateCentavos * dayOffTasks;

        dailyMap.get(date)!.push({
          date,
          creatorId: creator.id,
          creatorName: creator.name,
          deliveredTasks: dateTasks.length,
          regularTasks,
          dayOffTasks,
          dailyBaseSalaryCentavos,
          regularPayoutCentavos,
          dayOffPayoutCentavos,
          totalPayoutCentavos: regularPayoutCentavos + dayOffPayoutCentavos,
        });
      }
    }

    return dailyMap;
  }
}

export const payoutCalculationService = new PayoutCalculationService(
  repositoryFactory.getTaskRepository(),
  repositoryFactory.getCreatorRepository()
);
