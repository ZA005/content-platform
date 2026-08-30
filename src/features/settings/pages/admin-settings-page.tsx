import { useRef, useState } from "react";
import { Download, MoreHorizontal, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { STORAGE_KEYS } from "@/core/constants";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { Creator, Manager } from "@/core/types";
import { ManagerFormModal } from "@/features/managers/components/manager-form-modal";
import { useManagers } from "@/features/managers/hooks/use-managers";
import type { ManagerFormValues } from "@/features/managers/components/manager-form-modal";
import { exportToExcel, importFromExcel, saveImportedData } from "@/features/admin/utils/excel-utils";
import { storageService } from "@/infrastructure/storage/storage-service";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function AdminSettingsPage() {
  const { user } = useAuth();
  const { managers, createManager, updateManager, deleteManager } = useManagers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifyOnAssign, setNotifyOnAssign] = useState(true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [managerFormOpen, setManagerFormOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    const creators = storageService.get<Creator[]>(STORAGE_KEYS.CREATORS) ?? [];
    const adminCreator = creators.find((c) => c.id === user?.creatorId);

    if (!adminCreator || adminCreator.password !== currentPassword) {
      toast.error("Current password is incorrect");
      return;
    }

    const updatedCreators = creators.map((c) =>
      c.id === adminCreator.id ? { ...c, password: newPassword, updatedAt: new Date().toISOString() } : c,
    );

    storageService.set(STORAGE_KEYS.CREATORS, updatedCreators);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(false);
    toast.success("Password has been changed successfully");
  };

  const handleOpenCreateManager = () => {
    setEditingManager(null);
    setManagerFormOpen(true);
  };

  const handleOpenEditManager = (manager: Manager) => {
    setEditingManager(manager);
    setManagerFormOpen(true);
  };

  const handleSubmitManager = async (values: ManagerFormValues) => {
    if (editingManager) {
      const payload = {
        name: values.name,
        username: values.username,
        avatarUrl: values.avatarUrl,
        ...(values.password ? { password: values.password } : {}),
      };
      await updateManager(editingManager.id, payload);
    } else {
      await createManager({
        name: values.name,
        username: values.username,
        password: values.password,
        avatarUrl: values.avatarUrl,
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportToExcel();
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    setIsImporting(true);
    importFromExcel(file)
      .then((data) => {
        saveImportedData(data);
        toast.success(`Data imported successfully: ${data.creators.length} creators, ${data.tasks.length} tasks`);
        window.location.reload();
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Failed to import data");
      })
      .finally(() => {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace and account preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your admin session details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="text-foreground break-words">{user?.name}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono text-foreground break-all">{user?.username}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize text-foreground">{user?.role}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Managers</CardTitle>
              <CardDescription>Create and manage manager accounts.</CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenCreateManager}>
              <Plus className="size-4" />
              Add Manager
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No managers yet. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {managers.map((manager) => (
                <div key={manager.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials(manager.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{manager.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{manager.username}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEditManager(manager)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-danger focus:text-danger"
                        onClick={() => setDeletingManager(manager)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Import and export your data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export to Excel
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              <Upload className="size-4" />
              {isImporting ? "Importing…" : "Import from Excel"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Export your creators and tasks to an Excel file. Import from a previously exported file to restore or migrate data.
            Only .xlsx and .xls files are supported.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isChangingPassword ? (
            <Button onClick={() => setIsChangingPassword(true)} variant="outline" size="sm">
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter a new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleChangePassword} size="sm">
                  Save Password
                </Button>
                <Button onClick={() => setIsChangingPassword(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose what triggers an alert (UI preview only, for now).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="notify-assign" className="font-normal">
              Notify me when a task is assigned
            </Label>
            <Switch id="notify-assign" checked={notifyOnAssign} onCheckedChange={setNotifyOnAssign} />
          </div>
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="notify-complete" className="font-normal">
              Notify me when a task is completed
            </Label>
            <Switch id="notify-complete" checked={notifyOnComplete} onCheckedChange={setNotifyOnComplete} />
          </div>
        </CardContent>
      </Card>

      <ManagerFormModal
        open={managerFormOpen}
        onOpenChange={setManagerFormOpen}
        manager={editingManager}
        onSubmit={handleSubmitManager}
      />

      <ConfirmDialog
        open={Boolean(deletingManager)}
        onOpenChange={(o) => !o && setDeletingManager(null)}
        title="Delete this manager?"
        description="This removes their account permanently."
        confirmLabel="Delete manager"
        onConfirm={async () => {
          if (deletingManager) await deleteManager(deletingManager.id);
        }}
      />
    </div>
  );
}
