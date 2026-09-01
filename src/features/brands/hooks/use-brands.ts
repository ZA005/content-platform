import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { brandService } from "../services/brand-service";
import { brandKeys } from "./query-keys";

export function useBrands() {
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading, error, refetch } = useQuery({
    queryKey: brandKeys.list(),
    queryFn: () => brandService.getAll(),
  });

  const addBrandMutation = useMutation({
    mutationFn: (brandName: string) => brandService.add(brandName),
    onSuccess: () => {
      toast.success("Brand added");
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });

  const removeBrandMutation = useMutation({
    mutationFn: (brandName: string) => brandService.remove(brandName),
    onSuccess: () => {
      toast.success("Brand removed");
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });

  const addBrand = useCallback((brandName: string) => addBrandMutation.mutateAsync(brandName), [addBrandMutation]);
  const removeBrand = useCallback((brandName: string) => removeBrandMutation.mutateAsync(brandName), [removeBrandMutation]);

  return { brands, isLoading, error: error?.message ?? null, refetch, addBrand, removeBrand };
}
