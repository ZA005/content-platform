import type {
  CompensationRepository,
  PayoutConfigurationRepository,
  WorkScheduleRepository,
} from "@/core/interfaces/repositories";
import type {
  CompensationProfile,
  PayoutConfiguration,
  UserRole,
  WorkSchedule,
} from "@/core/types";
import { type ResolvedCompensation, resolveCompensation } from "@/features/payouts/domain/payout-calculator";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";

export class PayoutConfigurationService {
  #payoutConfigRepository: PayoutConfigurationRepository;
  #compensationRepository: CompensationRepository;
  #workScheduleRepository: WorkScheduleRepository;

  constructor(
    payoutConfigRepository: PayoutConfigurationRepository,
    compensationRepository: CompensationRepository,
    workScheduleRepository: WorkScheduleRepository,
  ) {
    this.#payoutConfigRepository = payoutConfigRepository;
    this.#compensationRepository = compensationRepository;
    this.#workScheduleRepository = workScheduleRepository;
  }

  async getConfiguration(): Promise<PayoutConfiguration> {
    return this.#payoutConfigRepository.get();
  }

  async updateConfiguration(input: Partial<PayoutConfiguration>): Promise<PayoutConfiguration> {
    return this.#payoutConfigRepository.update(input);
  }

  async getCompensation(userId: string): Promise<CompensationProfile | null> {
    return this.#compensationRepository.getByUserId(userId);
  }

  async listCompensation(): Promise<CompensationProfile[]> {
    return this.#compensationRepository.list();
  }

  async getWorkSchedule(userId: string): Promise<WorkSchedule | null> {
    return this.#workScheduleRepository.getByUserId(userId);
  }

  async listWorkSchedules(): Promise<WorkSchedule[]> {
    return this.#workScheduleRepository.list();
  }

  async resolveCompensationForUser(
    userId: string,
    role: UserRole
  ): Promise<ResolvedCompensation> {
    const config = await this.getConfiguration();
    const profile = await this.getCompensation(userId);

    const roleDefault =
      role === "creator"
        ? config.roleDefaults.creator
        : role === "manager"
          ? config.roleDefaults.manager
          : undefined;

    const resolved = resolveCompensation(profile, roleDefault, config.defaultDayOffMultiplier);
    return resolved;
  }

  async resolveWorkScheduleForUser(userId: string): Promise<WorkSchedule | null> {
    const schedule = await this.getWorkSchedule(userId);
    if (schedule) return schedule;

    const config = await this.getConfiguration();
    return {
      id: "",
      userId,
      workingDays: config.defaultWorkingDays,
      customDaysOff: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

export const payoutConfigurationService = new PayoutConfigurationService(
  repositoryFactory.getPayoutConfigurationRepository(),
  repositoryFactory.getCompensationRepository(),
  repositoryFactory.getWorkScheduleRepository()
);
