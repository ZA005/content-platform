import { STORAGE_KEYS } from "@/core/constants";
import type {
  CompensationRepository,
  UpsertCompensationInput,
} from "@/core/interfaces/repositories";
import type { CompensationProfile, ID, UserRole } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

function readAll(): CompensationProfile[] {
  return storageService.get<CompensationProfile[]>(STORAGE_KEYS.COMPENSATION) ?? [];
}

function writeAll(profiles: CompensationProfile[]): void {
  storageService.set(STORAGE_KEYS.COMPENSATION, profiles);
}

function generateId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalStorageCompensationRepository implements CompensationRepository {
  async list(): Promise<CompensationProfile[]> {
    return readAll();
  }

  async getByUserId(userId: ID): Promise<CompensationProfile | null> {
    const profiles = readAll();
    return profiles.find((p) => p.userId === userId) ?? null;
  }

  async upsert(
    userId: ID,
    role: Extract<UserRole, "creator" | "manager">,
    input: UpsertCompensationInput
  ): Promise<CompensationProfile> {
    const profiles = readAll();
    const existing = profiles.find((p) => p.userId === userId);

    if (existing) {
      existing.baseSalaryCentavos = input.baseSalaryCentavos;
      existing.dayOffMultiplier = input.dayOffMultiplier;
      if (input.effectiveDate) existing.effectiveDate = input.effectiveDate;
      existing.updatedAt = new Date().toISOString();
      writeAll(profiles);
      return existing;
    }

    const newProfile: CompensationProfile = {
      id: generateId(),
      userId,
      role,
      baseSalaryCentavos: input.baseSalaryCentavos,
      dayOffMultiplier: input.dayOffMultiplier,
      effectiveDate: input.effectiveDate ?? new Date().toISOString().split("T")[0],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    profiles.push(newProfile);
    writeAll(profiles);
    return newProfile;
  }

  async delete(id: ID): Promise<void> {
    const profiles = readAll();
    const filtered = profiles.filter((p) => p.id !== id);
    writeAll(filtered);
  }
}

export const localStorageCompensationRepository = new LocalStorageCompensationRepository();
