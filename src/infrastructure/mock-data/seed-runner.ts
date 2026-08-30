import { SEED_VERSION, STORAGE_KEYS } from "@/core/constants";
import type { Creator, Task } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";
import { buildSeedCreators, buildSeedTasks } from "./seed";

/**
 * Populates localStorage with mock creators/tasks the first time the app
 * runs, or whenever SEED_VERSION changes. Safe to call on every bootstrap —
 * it's a no-op once the current seed version has already been written.
 */
export function runSeedIfNeeded(): void {
  const existingVersion = storageService.get<string>(STORAGE_KEYS.SEED_VERSION);
  if (existingVersion === SEED_VERSION) return;

  const creators: Creator[] = buildSeedCreators();
  const tasks: Task[] = buildSeedTasks(creators);

  storageService.set(STORAGE_KEYS.CREATORS, creators);
  storageService.set(STORAGE_KEYS.TASKS, tasks);
  storageService.set(STORAGE_KEYS.SEED_VERSION, SEED_VERSION);
}
