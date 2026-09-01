import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { importData } from "@/features/admin/services/data-export-import-service";
import { ExportConfirmDialog } from "@/features/admin/components/export-confirm-dialog";

export function ManagerSettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    setIsImporting(true);
    importData(file)
      .then((summary) => {
        const { creators, tasks, errors } = summary;
        toast.success(
          `Imported: ${creators.created} creators created, ${creators.updated} updated, ` +
            `${tasks.created} tasks created, ${tasks.updated} updated` +
            (errors.length > 0 ? ` — ${errors.length} row(s) skipped, see console` : ""),
        );
        if (errors.length > 0) {
          console.warn("Import row errors:", errors);
        }
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
          <CardDescription>Your manager session details.</CardDescription>
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
          <CardTitle>Data</CardTitle>
          <CardDescription>Import and export your data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setExportConfirmOpen(true)}>
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

      <ExportConfirmDialog
        open={exportConfirmOpen}
        onOpenChange={setExportConfirmOpen}
      />
    </div>
  );
}
