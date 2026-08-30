import { STORAGE_KEYS } from "@/core/constants";
import type { PayoutRepository } from "@/core/interfaces/repositories";
import type { FinalizedPayoutRecord, ID } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

function readAll(): FinalizedPayoutRecord[] {
  return storageService.get<FinalizedPayoutRecord[]>(STORAGE_KEYS.PAYOUTS) ?? [];
}

function writeAll(records: FinalizedPayoutRecord[]): void {
  storageService.set(STORAGE_KEYS.PAYOUTS, records);
}

export class LocalStoragePayoutRepository implements PayoutRepository {
  async listByMonth(month: string): Promise<FinalizedPayoutRecord[]> {
    const records = readAll();
    return records.filter((r) => r.summary.month === month);
  }

  async getByUserAndMonth(userId: ID, month: string): Promise<FinalizedPayoutRecord | null> {
    const records = readAll();
    return (
      records.find((r) => r.summary.userId === userId && r.summary.month === month) ?? null
    );
  }

  async finalizeMonth(month: string, records: FinalizedPayoutRecord[]): Promise<void> {
    const current = readAll();
    const filtered = current.filter((r) => r.summary.month !== month);
    const timestamped = records.map((r) => ({
      ...r,
      summary: {
        ...r.summary,
        finalized: true,
        finalizedAt: new Date().toISOString(),
      },
    }));
    writeAll([...filtered, ...timestamped]);
  }

  async unfinalizeMonth(month: string): Promise<void> {
    const records = readAll();
    const filtered = records.filter((r) => r.summary.month !== month);
    writeAll(filtered);
  }
}

export const localStoragePayoutRepository = new LocalStoragePayoutRepository();
