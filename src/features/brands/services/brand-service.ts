import type { BrandRepository } from "@/core/interfaces/repositories";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";

export class BrandService {
  private readonly brandRepository: BrandRepository;

  constructor(brandRepository: BrandRepository) {
    this.brandRepository = brandRepository;
  }

  getAll(): Promise<string[]> {
    return this.brandRepository.list();
  }

  add(brand: string): Promise<void> {
    return this.brandRepository.add(brand);
  }

  remove(brand: string): Promise<void> {
    return this.brandRepository.remove(brand);
  }
}

export const brandService = new BrandService(repositoryFactory.getBrandRepository());
