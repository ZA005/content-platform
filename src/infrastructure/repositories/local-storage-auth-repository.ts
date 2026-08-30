import { STORAGE_KEYS, USER_ROLE } from "@/core/constants";
import type { AuthRepository } from "@/core/interfaces/repositories";
import type { AuthUser, Manager, Session } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";
import { localStorageCreatorRepository } from "./local-storage-creator-repository";

const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin",
};

export class LocalStorageAuthRepository implements AuthRepository {
  async login(username: string, password: string): Promise<AuthUser> {
    const normalizedUsername = username.trim().toLowerCase();

    if (
      normalizedUsername === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const user: AuthUser = {
        id: "admin",
        username: ADMIN_CREDENTIALS.username,
        role: USER_ROLE.ADMIN,
        name: "Admin",
      };
      this.persistSession(user);
      return user;
    }

    const creator = await localStorageCreatorRepository.getByUsername(normalizedUsername);
    if (creator && creator.password === password) {
      if (creator.status === "disabled") {
        throw new Error("This creator account has been disabled. Contact your admin.");
      }
      const user: AuthUser = {
        id: creator.id,
        username: creator.username,
        role: USER_ROLE.CREATOR,
        name: creator.name,
        creatorId: creator.id,
      };
      this.persistSession(user);
      return user;
    }

    const managers = storageService.get<Manager[]>(STORAGE_KEYS.MANAGERS) ?? [];
    const manager = managers.find((m) => m.username.toLowerCase() === normalizedUsername);
    if (manager && manager.password === password) {
      const user: AuthUser = {
        id: manager.id,
        username: manager.username,
        role: USER_ROLE.MANAGER,
        name: manager.name,
      };
      this.persistSession(user);
      return user;
    }

    throw new Error("Invalid username or password.");
  }

  async logout(): Promise<void> {
    storageService.remove(STORAGE_KEYS.SESSION);
  }

  async getSession(): Promise<Session | null> {
    return storageService.get<Session>(STORAGE_KEYS.SESSION);
  }

  private persistSession(user: AuthUser): void {
    const session: Session = { user, issuedAt: new Date().toISOString() };
    storageService.set(STORAGE_KEYS.SESSION, session);
  }
}

export const localStorageAuthRepository = new LocalStorageAuthRepository();
