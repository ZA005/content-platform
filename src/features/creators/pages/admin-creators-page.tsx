import { useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { CREATOR_STATUS } from "@/core/constants";
import type { Creator } from "@/core/types";
import { AddBrandDialog } from "@/features/brands/components/add-brand-dialog";
import { CreatorFormModal } from "../components/creator-form-modal";
import { useCreators } from "../hooks/use-creators";
import type { CreatorFormValues } from "../schema";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function AdminCreatorsPage() {
  const { creators, isLoading, createCreator, updateCreator, toggleStatus, deleteCreator } = useCreators();
  const [formOpen, setFormOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [deletingCreator, setDeletingCreator] = useState<Creator | null>(null);

  const openCreate = () => {
    setEditingCreator(null);
    setFormOpen(true);
  };

  const openEdit = (creator: Creator) => {
    setEditingCreator(creator);
    setFormOpen(true);
  };

  const handleSubmit = async (values: CreatorFormValues) => {
    const payload = {
      name: values.name,
      username: values.username,
      brands: values.brands,
      avatarUrl: values.avatarUrl || "",
      ...(values.password ? { password: values.password } : {}),
    };
    if (editingCreator) {
      await updateCreator(editingCreator.id, payload);
    } else {
      await createCreator({ ...payload, password: values.password! });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Creators</h1>
          <p className="text-sm text-muted-foreground">Manage the people producing content for your team.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBrandDialogOpen(true)}>
            <Plus className="size-4" />
            Add Brand
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add Creator
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : creators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No creators yet"
          description="Add your first creator to start assigning tasks."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Add Creator
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead className="hidden sm:table-cell">Brands</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="text-xs sm:text-sm">{initials(creator.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{creator.name}</p>
                        <p className="truncate text-xs font-mono text-muted-foreground sm:hidden">{creator.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {creator.brands.map((brand) => (
                        <span key={brand} className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={creator.status === CREATOR_STATUS.ACTIVE ? "success" : "outline"}>
                      {creator.status === CREATOR_STATUS.ACTIVE ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                          <MoreHorizontal className="size-3 sm:size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(creator)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(creator)}>
                          {creator.status === CREATOR_STATUS.ACTIVE ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger focus:text-danger"
                          onClick={() => setDeletingCreator(creator)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreatorFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        creator={editingCreator}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingCreator)}
        onOpenChange={(o) => !o && setDeletingCreator(null)}
        title="Delete this creator?"
        description="This removes their account permanently. Their existing tasks will remain but show as unassigned."
        confirmLabel="Delete creator"
        onConfirm={async () => {
          if (deletingCreator) await deleteCreator(deletingCreator.id);
        }}
      />

      <AddBrandDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
      />
    </div>
  );
}
