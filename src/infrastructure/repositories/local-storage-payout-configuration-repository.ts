import { STORAGE_KEYS } from "@/core/constants";
import type { PayoutConfigurationRepository } from "@/core/interfaces/repositories";
import type { PayoutConfiguration } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

const DEFAULT_CONFIG: PayoutConfiguration = {
  payoutDayOfMonth: 15,
  defaultDayOffMultiplier: 1.5,
  defaultWorkingDays: [1, 2, 3, 4, 5],
  roleDefaults: {
    creator: {},
    manager: {},
  },
  updatedAt: new Date().toISOString(),
};

export class LocalStoragePayoutConfigurationRepository implements PayoutConfigurationRepository {
  async get(): Promise<PayoutConfiguration> {
    const config = storageService.get<PayoutConfiguration>(STORAGE_KEYS.PAYOUT_CONFIG);
    return config ?? DEFAULT_CONFIG;
  }

  async update(input: Partial<PayoutConfiguration>): Promise<PayoutConfiguration> {
    const current = await this.get();
    const updated: PayoutConfiguration = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    storageService.set(STORAGE_KEYS.PAYOUT_CONFIG, updated);
    return updated;
  }
}

export const localStoragePayoutConfigurationRepository =
  new LocalStoragePayoutConfigurationRepository();
