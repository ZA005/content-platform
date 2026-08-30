import { STORAGE_KEYS } from "@/core/constants";
import type {
  UpsertWorkScheduleInput,
  WorkScheduleRepository,
} from "@/core/interfaces/repositories";
import type { ID, WorkSchedule } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

function readAll(): WorkSchedule[] {
  return storageService.get<WorkSchedule[]>(STORAGE_KEYS.WORK_SCHEDULES) ?? [];
}

function writeAll(schedules: WorkSchedule[]): void {
  storageService.set(STORAGE_KEYS.WORK_SCHEDULES, schedules);
}

function generateId(): string {
  return `sch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalStorageWorkScheduleRepository implements WorkScheduleRepository {
  async list(): Promise<WorkSchedule[]> {
    return readAll();
  }

  async getByUserId(userId: ID): Promise<WorkSchedule | null> {
    const schedules = readAll();
    return schedules.find((s) => s.userId === userId) ?? null;
  }

  async upsert(userId: ID, input: UpsertWorkScheduleInput): Promise<WorkSchedule> {
    const schedules = readAll();
    const existing = schedules.find((s) => s.userId === userId);

    if (existing) {
      existing.workingDays = input.workingDays;
      existing.customDaysOff = input.customDaysOff ?? [];
      existing.updatedAt = new Date().toISOString();
      writeAll(schedules);
      return existing;
    }

    const newSchedule: WorkSchedule = {
      id: generateId(),
      userId,
      workingDays: input.workingDays,
      customDaysOff: input.customDaysOff ?? [],
      updatedAt: new Date().toISOString(),
    };

    schedules.push(newSchedule);
    writeAll(schedules);
    return newSchedule;
  }
}

export const localStorageWorkScheduleRepository = new LocalStorageWorkScheduleRepository();
