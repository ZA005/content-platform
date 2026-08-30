import { STORAGE_KEYS } from "@/core/constants";
import type { CreateManagerInput, ManagerRepository, UpdateManagerInput } from "@/core/interfaces/repositories";
import type { ID, Manager } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

function readAll(): Manager[] {
  return storageService.get<Manager[]>(STORAGE_KEYS.MANAGERS) ?? [];
}

function writeAll(managers: Manager[]): void {
  storageService.set(STORAGE_KEYS.MANAGERS, managers);
}

function generateId(): ID {
  return `manager-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalStorageManagerRepository implements ManagerRepository {
  async list(): Promise<Manager[]> {
    return [...readAll()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(id: ID): Promise<Manager | null> {
    return readAll().find((m) => m.id === id) ?? null;
  }

  async getByUsername(username: string): Promise<Manager | null> {
    const normalized = username.trim().toLowerCase();
    return readAll().find((m) => m.username.toLowerCase() === normalized) ?? null;
  }

  async create(input: CreateManagerInput): Promise<Manager> {
    const managers = readAll();

    if (managers.some((m) => m.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error("That username is already taken.");
    }

    const now = new Date().toISOString();
    const manager: Manager = {
      id: generateId(),
      name: input.name,
      username: input.username,
      password: input.password,
      avatarUrl: input.avatarUrl ?? "",
      createdAt: now,
      updatedAt: now,
    };

    writeAll([...managers, manager]);
    return manager;
  }

  async update(id: ID, input: UpdateManagerInput): Promise<Manager> {
    const managers = readAll();
    const index = managers.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Manager not found.");

    const updated: Manager = {
      ...managers[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    managers[index] = updated;
    writeAll(managers);
    return updated;
  }

  async delete(id: ID): Promise<void> {
    writeAll(readAll().filter((m) => m.id !== id));
  }
}

export const localStorageManagerRepository = new LocalStorageManagerRepository();
