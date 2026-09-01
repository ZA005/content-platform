import * as XLSX from "xlsx";
import { STORAGE_KEYS, STORAGE_KEYS_BRANDS } from "@/core/constants";
import type { Creator, ImportSummary, Task } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import { storageService } from "@/infrastructure/storage/storage-service";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      resolve(arrayBufferToBase64(buffer));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function exportViaEdgeFunction(entities: string[]): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("export-data", { body: { entities } });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const { base64, filename } = data.data;
  downloadBlob(base64ToBlob(base64, XLSX_MIME), filename);
}

function exportLocal(entities: string[]): void {
  const workbook = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().slice(0, 10);

  if (entities.includes("creators")) {
    const creators = storageService.get<Creator[]>(STORAGE_KEYS.CREATORS) ?? [];
    const creatorsData = creators.map((c) => ({
      ID: c.id,
      Name: c.name,
      Username: c.username,
      Status: c.status,
      Brands: c.brands.join("; "),
      "Avatar URL": c.avatarUrl || "",
      "Created At": c.createdAt,
      "Updated At": c.updatedAt,
    }));
    const creatorsSheet = XLSX.utils.json_to_sheet(creatorsData);
    XLSX.utils.book_append_sheet(workbook, creatorsSheet, "Creators");
  }

  if (entities.includes("tasks")) {
    const tasks = storageService.get<Task[]>(STORAGE_KEYS.TASKS) ?? [];
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
    const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");
  }

  if (entities.includes("managers")) {
    const managers = storageService.get<any[]>(STORAGE_KEYS.MANAGERS) ?? [];
    const managersData = managers.map((m) => ({
      ID: m.id,
      Name: m.name,
      Username: m.username,
      "Avatar URL": m.avatarUrl || "",
      "Created At": m.createdAt,
      "Updated At": m.updatedAt,
    }));
    const managersSheet = XLSX.utils.json_to_sheet(managersData);
    XLSX.utils.book_append_sheet(workbook, managersSheet, "Managers");
  }

  if (entities.includes("compensation")) {
    const compensation = storageService.get<any[]>(STORAGE_KEYS.COMPENSATION) ?? [];
    const compensationData = compensation.map((c) => ({
      ID: c.id,
      "User ID": c.userId,
      Role: c.role,
      "Base Salary (Centavos)": c.baseSalaryCentavos,
      "Day Off Multiplier": c.dayOffMultiplier || "",
      "Effective Date": c.effectiveDate,
      Active: c.active ? "TRUE" : "FALSE",
      "Created At": c.createdAt,
      "Updated At": c.updatedAt,
    }));
    const compensationSheet = XLSX.utils.json_to_sheet(compensationData);
    XLSX.utils.book_append_sheet(workbook, compensationSheet, "Compensation");
  }

  if (entities.includes("payout-config")) {
    const config = storageService.get<any>(STORAGE_KEYS.PAYOUT_CONFIG);
    if (config) {
      const configData = [{
        "Payout Day Of Month": config.payoutDayOfMonth,
        "Default Day Off Multiplier": config.defaultDayOffMultiplier,
        "Default Working Days": (config.defaultWorkingDays || []).join(","),
        "Creator Base Salary (Centavos)": config.roleDefaults?.creator?.baseSalaryCentavos || "",
        "Creator Day Off Multiplier": config.roleDefaults?.creator?.dayOffMultiplier || "",
        "Manager Base Salary (Centavos)": config.roleDefaults?.manager?.baseSalaryCentavos || "",
        "Manager Day Off Multiplier": config.roleDefaults?.manager?.dayOffMultiplier || "",
        "Updated At": config.updatedAt,
      }];
      const configSheet = XLSX.utils.json_to_sheet(configData);
      XLSX.utils.book_append_sheet(workbook, configSheet, "PayoutConfig");
    }
  }

  if (entities.includes("work-schedules")) {
    const schedules = storageService.get<any[]>(STORAGE_KEYS.WORK_SCHEDULES) ?? [];
    const schedulesData = schedules.map((s) => ({
      ID: s.id,
      "User ID": s.userId,
      "Working Days": (s.workingDays || []).join(","),
      "Custom Days Off": (s.customDaysOff || []).join(";"),
      "Updated At": s.updatedAt,
    }));
    const schedulesSheet = XLSX.utils.json_to_sheet(schedulesData);
    XLSX.utils.book_append_sheet(workbook, schedulesSheet, "WorkSchedules");
  }

  if (entities.includes("brands")) {
    const brands = storageService.get<string[]>(STORAGE_KEYS_BRANDS) ?? [];
    const brandsData = brands.map((b) => ({ Brand: b }));
    const brandsSheet = XLSX.utils.json_to_sheet(brandsData);
    XLSX.utils.book_append_sheet(workbook, brandsSheet, "Brands");
  }

  XLSX.writeFile(workbook, `content-platform-export-${timestamp}.xlsx`);
}

export async function exportData(entities: string[] = ["creators", "tasks"]): Promise<void> {
  if (repositoryFactory.getMode() === "supabase") {
    await exportViaEdgeFunction(entities);
  } else {
    exportLocal(entities);
  }
}

async function importViaEdgeFunction(file: File, dryRun?: boolean): Promise<ImportSummary> {
  const supabase = getSupabaseClient();
  const base64 = await fileToBase64(file);

  const { data, error } = await supabase.functions.invoke("import-data", {
    body: { base64, filename: file.name, dryRun: dryRun ?? false },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data.data as ImportSummary;
}

function importLocal(file: File, dryRun?: boolean): Promise<ImportSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });

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
          password: "",
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

        if (!dryRun) {
          storageService.set(STORAGE_KEYS.CREATORS, creators);
          storageService.set(STORAGE_KEYS.TASKS, tasks);
        }

        resolve({
          creators: { created: creators.length, updated: 0, skipped: 0 },
          tasks: { created: tasks.length, updated: 0, skipped: 0 },
          errors: [],
          dryRun: dryRun ?? false,
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Failed to parse Excel file"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export async function importData(file: File, options?: { dryRun?: boolean }): Promise<ImportSummary> {
  if (repositoryFactory.getMode() === "supabase") {
    return importViaEdgeFunction(file, options?.dryRun);
  }
  return importLocal(file, options?.dryRun);
}
