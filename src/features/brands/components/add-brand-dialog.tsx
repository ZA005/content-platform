import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useBrands } from "../hooks/use-brands";
import { brandService } from "../services/brand-service";

interface AddBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddBrandDialog({ open, onOpenChange, onSuccess }: AddBrandDialogProps) {
  const { brands, refetch: refetchBrands } = useBrands();
  const [brandName, setBrandName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingBrand, setRemovingBrand] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBrandName("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setIsAdding(true);
    try {
      await brandService.add(brandName.trim());
      toast.success(`Brand "${brandName}" added successfully`);
      setBrandName("");
      await refetchBrands();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add brand");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveBrand = async (brand: string) => {
    setRemovingBrand(brand);
    try {
      await brandService.remove(brand);
      toast.success(`Brand "${brand}" removed`);
      await refetchBrands();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove brand");
    } finally {
      setRemovingBrand(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Brands</DialogTitle>
          <DialogDescription>Add and manage brands in the system.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {brands.length > 0 && (
            <div className="space-y-2">
              <Label>Brands Added</Label>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center gap-2 rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary"
                  >
                    <span>{brand}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBrand(brand)}
                      disabled={removingBrand === brand}
                      className="ml-1 hover:opacity-80 disabled:opacity-50"
                    >
                      {removingBrand === brand ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Add New Brand</Label>
              <Input
                id="brand-name"
                placeholder="e.g., Gucci, Louis Vuitton"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                disabled={isAdding}
                autoFocus
              />
            </div>

            <Button type="submit" disabled={isAdding} className="w-full">
              {isAdding && <Loader2 className="size-4 animate-spin" />}
              Add Brand
            </Button>
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
