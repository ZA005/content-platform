import * as XLSX from "xlsx";
import { STORAGE_KEYS } from "@/core/constants";
import type { Creator, Task } from "@/core/types";
import { storageService } from "@/infrastructure/storage/storage-service";

export interface ExportData {
  creators: Creator[];
  tasks: Task[];
}

export async function exportToExcel(): Promise<void> {
  const creators = storageService.get<Creator[]>(STORAGE_KEYS.CREATORS) ?? [];
  const tasks = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];

  const workbook = XLSX.utils.book_new();

  const creatorsData = creators.map((c) => ({
    ID: c.id,
    Name: c.name,
    Username: c.username,
    Password: c.password,
    Status: c.status,
    Brands: c.brands.join("; "),
    "Avatar URL": c.avatarUrl || "",
    "Created At": c.createdAt,
    "Updated At": c.updatedAt,
  }));

  const tasksData = tasks.map((t) => ({
    ID: t.id,
    "Creator ID": t.creatorId,
    "Scheduled Date": t.scheduledDate,
    Brand: t.brand,
    "Script Link": t.scriptLink,
    "Reference Link": t.referenceLink || "",
    Instruction: t.instruction,
    Notes: t.notes,
    Status: t.status,
    "Created At": t.createdAt,
    "Updated At": t.updatedAt,
  }));

  const creatorsSheet = XLSX.utils.json_to_sheet(creatorsData);
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);

  XLSX.utils.book_append_sheet(workbook, creatorsSheet, "Creators");
  XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `content-platform-export-${timestamp}.xlsx`);
}

export async function importFromExcel(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: "array" });

        const creatorsSheet = workbook.Sheets["Creators"];
        const tasksSheet = workbook.Sheets["Tasks"];

        if (!creatorsSheet || !tasksSheet) {
          reject(new Error("Excel file must contain 'Creators' and 'Tasks' sheets"));
          return;
        }

        const creatorsData = XLSX.utils.sheet_to_json<any>(creatorsSheet);
        const tasksData = XLSX.utils.sheet_to_json<any>(tasksSheet);

        const creators: Creator[] = creatorsData.map((row) => ({
          id: row.ID,
          name: row.Name,
          username: row.Username,
          password: row.Password,
          status: row.Status as "active" | "disabled",
          brands: row.Brands ? row.Brands.split("; ").filter((b: string) => b) : [],
          avatarUrl: row["Avatar URL"] || undefined,
          createdAt: row["Created At"],
          updatedAt: row["Updated At"],
        }));

        const tasks: Task[] = tasksData.map((row) => ({
          id: row.ID,
          creatorId: row["Creator ID"],
          scheduledDate: row["Scheduled Date"],
          brand: row.Brand,
          scriptLink: row["Script Link"],
          referenceLink: row["Reference Link"] || undefined,
          instruction: row.Instruction,
          notes: row.Notes,
          status: row.Status,
          createdAt: row["Created At"],
          updatedAt: row["Updated At"],
        }));

        resolve({ creators, tasks });
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Failed to parse Excel file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function saveImportedData(data: ExportData): void {
  storageService.set(STORAGE_KEYS.CREATORS, data.creators);
  storageService.set(STORAGE_KEYS.TASKS, data.tasks);
}
