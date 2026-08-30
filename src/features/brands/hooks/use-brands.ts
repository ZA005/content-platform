import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { brandService } from "../services/brand-service";

export function useBrands() {
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBrands(await brandService.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addBrand = useCallback(
    async (brandName: string) => {
      await brandService.add(brandName);
      toast.success("Brand added");
      await refetch();
    },
    [refetch],
  );

  const removeBrand = useCallback(
    async (brandName: string) => {
      await brandService.remove(brandName);
      toast.success("Brand removed");
      await refetch();
    },
    [refetch],
  );

  return { brands, isLoading, error, refetch, addBrand, removeBrand };
}
