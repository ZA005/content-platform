import { CREATOR_STATUS, STORAGE_KEYS } from "@/core/constants";
import type {
  CreateCreatorInput,
  CreatorRepository,
  UpdateCreatorInput,
} from "@/core/interfaces/repositories";
import type { Creator, ID } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

function readAll(): Creator[] {
  return storageService.get<Creator[]>(STORAGE_KEYS.CREATORS) ?? [];
}

function writeAll(creators: Creator[]): void {
  storageService.set(STORAGE_KEYS.CREATORS, creators);
}

function generateId(): ID {
  return `creator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalStorageCreatorRepository implements CreatorRepository {
  async list(): Promise<Creator[]> {
    return [...readAll()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(id: ID): Promise<Creator | null> {
    return readAll().find((c) => c.id === id) ?? null;
  }

  async getByUsername(username: string): Promise<Creator | null> {
    const normalized = username.trim().toLowerCase();
    return readAll().find((c) => c.username.toLowerCase() === normalized) ?? null;
  }

  async create(input: CreateCreatorInput): Promise<Creator> {
    const creators = readAll();

    if (creators.some((c) => c.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error("That username is already taken.");
    }

    const now = new Date().toISOString();
    const creator: Creator = {
      id: generateId(),
      name: input.name,
      username: input.username,
      password: input.password,
      brands: input.brands,
      status: CREATOR_STATUS.ACTIVE,
      avatarUrl: input.avatarUrl ?? "",
      createdAt: now,
      updatedAt: now,
    };

    writeAll([...creators, creator]);
    return creator;
  }

  async update(id: ID, input: UpdateCreatorInput): Promise<Creator> {
    const creators = readAll();
    const index = creators.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Creator not found.");

    const updated: Creator = {
      ...creators[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    creators[index] = updated;
    writeAll(creators);
    return updated;
  }

  async disable(id: ID): Promise<Creator> {
    return this.update(id, { status: CREATOR_STATUS.DISABLED });
  }

  async enable(id: ID): Promise<Creator> {
    return this.update(id, { status: CREATOR_STATUS.ACTIVE });
  }

  async delete(id: ID): Promise<void> {
    writeAll(readAll().filter((c) => c.id !== id));
  }
}

export const localStorageCreatorRepository = new LocalStorageCreatorRepository();
