import { STORAGE_KEYS_BRANDS } from "@/core/constants";
import type { BrandRepository } from "@/core/interfaces/repositories";
import { storageService } from "@/infrastructure/storage/storage-service";

const DEFAULT_BRANDS = ["Nike", "Adidas", "Puma", "Reebok", "New Balance", "Asics", "Saucony", "HOKA"];

function readAll(): string[] {
  const brands = storageService.get<string[]>(STORAGE_KEYS_BRANDS);
  if (!brands) {
    storageService.set(STORAGE_KEYS_BRANDS, DEFAULT_BRANDS);
    return DEFAULT_BRANDS;
  }
  return brands;
}

function writeAll(brands: string[]): void {
  storageService.set(STORAGE_KEYS_BRANDS, brands);
}

export class LocalStorageBrandRepository implements BrandRepository {
  async list(): Promise<string[]> {
    return [...readAll()].sort();
  }

  async add(name: string): Promise<void> {
    const brands = readAll();
    if (brands.includes(name)) {
      throw new Error("This brand already exists");
    }
    writeAll([...brands, name].sort());
  }

  async remove(name: string): Promise<void> {
    const brands = readAll();
    writeAll(brands.filter((b) => b !== name));
  }
}

export const localStorageBrandRepository = new LocalStorageBrandRepository();
