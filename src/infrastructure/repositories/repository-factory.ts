import type { AuthRepository, BrandRepository, CreatorRepository, ManagerRepository, TaskRepository } from "@/core/interfaces/repositories";
import { localStorageAuthRepository } from "./local-storage-auth-repository";
import { localStorageCreatorRepository } from "./local-storage-creator-repository";
import { localStorageTaskRepository } from "./local-storage-task-repository";
import { localStorageManagerRepository } from "./local-storage-manager-repository";
import { localStorageBrandRepository } from "./local-storage-brand-repository";
import { supabaseAuthRepository } from "./supabase-auth-repository";
import { supabaseCreatorRepository } from "./supabase-creator-repository";
import { supabaseTaskRepository } from "./supabase-task-repository";
import { supabaseManagerRepository } from "./supabase-manager-repository";
import { supabaseBrandRepository } from "./supabase-brand-repository";

export type RepositoryMode = "local" | "supabase";

const getMode = (): RepositoryMode => {
  const mode = import.meta.env.VITE_REPOSITORY_MODE || "local";
  return mode as RepositoryMode;
};

export const repositoryFactory = {
  getAuthRepository(): AuthRepository {
    const mode = getMode();
    return mode === "supabase" ? supabaseAuthRepository : localStorageAuthRepository;
  },

  getCreatorRepository(): CreatorRepository {
    const mode = getMode();
    return mode === "supabase" ? supabaseCreatorRepository : localStorageCreatorRepository;
  },

  getTaskRepository(): TaskRepository {
    const mode = getMode();
    return mode === "supabase" ? supabaseTaskRepository : localStorageTaskRepository;
  },

  getManagerRepository(): ManagerRepository {
    const mode = getMode();
    return mode === "supabase" ? supabaseManagerRepository : localStorageManagerRepository;
  },

  getBrandRepository(): BrandRepository {
    const mode = getMode();
    return mode === "supabase" ? supabaseBrandRepository : localStorageBrandRepository;
  },

  getMode,
};
