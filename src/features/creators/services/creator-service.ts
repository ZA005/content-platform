import type {
  CreateCreatorInput,
  CreatorRepository,
  UpdateCreatorInput,
} from "@/core/interfaces/repositories";
import type { Creator, ID } from "@/core/types";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";

export class CreatorService {
  private readonly creatorRepository: CreatorRepository;

  constructor(creatorRepository: CreatorRepository) {
    this.creatorRepository = creatorRepository;
  }

  list(): Promise<Creator[]> {
    return this.creatorRepository.list();
  }

  getById(id: ID): Promise<Creator | null> {
    return this.creatorRepository.getById(id);
  }

  create(input: CreateCreatorInput): Promise<Creator> {
    return this.creatorRepository.create(input);
  }

  update(id: ID, input: UpdateCreatorInput): Promise<Creator> {
    return this.creatorRepository.update(id, input);
  }

  disable(id: ID): Promise<Creator> {
    return this.creatorRepository.disable(id);
  }

  enable(id: ID): Promise<Creator> {
    return this.creatorRepository.enable(id);
  }

  delete(id: ID): Promise<void> {
    return this.creatorRepository.delete(id);
  }
}

export const creatorService = new CreatorService(repositoryFactory.getCreatorRepository());
