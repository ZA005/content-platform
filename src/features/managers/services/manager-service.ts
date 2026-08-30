import type { CreateManagerInput, ManagerRepository, UpdateManagerInput } from "@/core/interfaces/repositories";
import type { Manager } from "@/core/types";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";

export class ManagerService {
  private readonly managerRepository: ManagerRepository;

  constructor(managerRepository: ManagerRepository) {
    this.managerRepository = managerRepository;
  }

  listAll(): Promise<Manager[]> {
    return this.managerRepository.list();
  }

  getById(id: string): Promise<Manager | null> {
    return this.managerRepository.getById(id);
  }

  getByUsername(username: string): Promise<Manager | null> {
    return this.managerRepository.getByUsername(username);
  }

  create(data: CreateManagerInput): Promise<Manager> {
    return this.managerRepository.create(data);
  }

  update(id: string, data: UpdateManagerInput): Promise<Manager> {
    return this.managerRepository.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.managerRepository.delete(id);
  }
}

export const managerService = new ManagerService(repositoryFactory.getManagerRepository());
