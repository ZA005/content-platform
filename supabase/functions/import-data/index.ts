import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { createCreatorUser } from "../_shared/user-management.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TASK_STATUSES = ["not_started", "in_progress", "in_review", "completed", "overdue"];
const CREATOR_STATUSES = ["active", "disabled"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ImportRequest {
  base64: string;
  filename?: string;
  dryRun?: boolean;
}

interface RowError {
  sheet: "Creators" | "Tasks";
  row: number;
  reason: string;
}

interface Summary {
  creators: { created: number; updated: number; skipped: number };
  tasks: { created: number; updated: number; skipped: number };
  errors: RowError[];
  dryRun: boolean;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

async function processCreators(
  adminClient: any,
  rows: any[],
  dryRun: boolean,
  summary: Summary,
): Promise<Map<string, string>> {
  // Maps lowercased username -> creator id, seeded from this batch as it's processed
  // so Tasks rows referencing a brand-new creator (created earlier in the same file)
  // can still resolve.
  const usernameToId = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const username = String(row.Username ?? "").trim();
    const name = String(row.Name ?? "").trim();

    if (isBlank(username) || isBlank(name)) {
      summary.errors.push({ sheet: "Creators", row: rowNum, reason: "Missing required field: Name or Username" });
      summary.creators.skipped++;
      continue;
    }

    const status = String(row.Status ?? "active").trim().toLowerCase();
    if (!CREATOR_STATUSES.includes(status)) {
      summary.errors.push({ sheet: "Creators", row: rowNum, reason: `Invalid Status value: "${row.Status}"` });
      summary.creators.skipped++;
      continue;
    }

    const brands = String(row.Brands ?? "")
      .split(";")
      .map((b: string) => b.trim())
      .filter((b: string) => b.length > 0);
    const avatarUrl = row["Avatar URL"] ? String(row["Avatar URL"]).trim() : undefined;

    const { data: existing } = await adminClient
      .from("creators")
      .select("id")
      .ilike("username", username)
      .single();

    if (existing) {
      usernameToId.set(username.toLowerCase(), existing.id);

      if (dryRun) {
        summary.creators.updated++;
        continue;
      }

      const { error: updateError } = await adminClient
        .from("creators")
        .update({
          name,
          brands,
          status,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        summary.errors.push({ sheet: "Creators", row: rowNum, reason: updateError.message });
        summary.creators.skipped++;
        continue;
      }

      summary.creators.updated++;
      continue;
    }

    // New creator — requires a password to create the Auth user
    const password = row.Password ? String(row.Password) : "";
    if (isBlank(password)) {
      summary.errors.push({
        sheet: "Creators",
        row: rowNum,
        reason: "New creator requires a Password to create their account",
      });
      summary.creators.skipped++;
      continue;
    }

    if (dryRun) {
      summary.creators.created++;
      continue;
    }

    const result = await createCreatorUser(adminClient, { name, username, password, brands, avatarUrl });
    if (result.error || !result.data) {
      summary.errors.push({ sheet: "Creators", row: rowNum, reason: result.error || "Failed to create creator" });
      summary.creators.skipped++;
      continue;
    }

    usernameToId.set(username.toLowerCase(), result.data.id);
    summary.creators.created++;
  }

  return usernameToId;
}

async function processTasks(
  adminClient: any,
  rows: any[],
  usernameToId: Map<string, string>,
  dryRun: boolean,
  summary: Summary,
): Promise<void> {
  const { data: existingCreators } = await adminClient.from("creators").select("id");
  const knownCreatorIds = new Set((existingCreators || []).map((c: any) => c.id));
  for (const id of usernameToId.values()) knownCreatorIds.add(id);

  const upsertRows: any[] = [];
  const rowNumbers: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const creatorId = String(row["Creator ID"] ?? "").trim();
    const scheduledDate = String(row["Scheduled Date"] ?? "").trim();
    const status = String(row.Status ?? "").trim().toLowerCase();
    const brand = String(row.Brand ?? "").trim();
    const scriptLink = String(row["Script Link"] ?? "").trim();

    if (isBlank(creatorId) || isBlank(scheduledDate) || isBlank(brand) || isBlank(scriptLink)) {
      summary.errors.push({
        sheet: "Tasks",
        row: rowNum,
        reason: "Missing required field: Creator ID, Scheduled Date, Brand, or Script Link",
      });
      summary.tasks.skipped++;
      continue;
    }

    if (!knownCreatorIds.has(creatorId)) {
      summary.errors.push({ sheet: "Tasks", row: rowNum, reason: `Creator ID "${creatorId}" not found` });
      summary.tasks.skipped++;
      continue;
    }

    if (!DATE_RE.test(scheduledDate) || Number.isNaN(Date.parse(scheduledDate))) {
      summary.errors.push({ sheet: "Tasks", row: rowNum, reason: `Invalid Scheduled Date: "${row["Scheduled Date"]}"` });
      summary.tasks.skipped++;
      continue;
    }

    if (!TASK_STATUSES.includes(status)) {
      summary.errors.push({ sheet: "Tasks", row: rowNum, reason: `Invalid Status value: "${row.Status}"` });
      summary.tasks.skipped++;
      continue;
    }

    const rawId = String(row.ID ?? "").trim();
    const id = isBlank(rawId) ? crypto.randomUUID() : rawId;
    const isNew = isBlank(rawId);

    upsertRows.push({
      id,
      creator_id: creatorId,
      scheduled_date: scheduledDate,
      brand,
      script_link: scriptLink,
      reference_link: row["Reference Link"] ? String(row["Reference Link"]).trim() : null,
      instruction: row.Instruction ? String(row.Instruction) : "",
      notes: row.Notes ? String(row.Notes) : "",
      status,
      updated_at: new Date().toISOString(),
    });
    rowNumbers.push(rowNum);

    if (isNew) summary.tasks.created++;
    else summary.tasks.updated++;
  }

  if (dryRun || upsertRows.length === 0) return;

  const { error: upsertError } = await adminClient.from("tasks").upsert(upsertRows, { onConflict: "id" });

  if (upsertError) {
    // Roll the optimistic counts back and report a single batch-level error,
    // since a failed upsert affects the whole batch atomically (unlike per-row
    // validation failures caught above).
    for (const rowNum of rowNumbers) {
      summary.errors.push({ sheet: "Tasks", row: rowNum, reason: upsertError.message });
    }
    summary.tasks.created = 0;
    summary.tasks.updated = 0;
    summary.tasks.skipped += upsertRows.length;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const role = String(callerProfile.role || "").trim().toLowerCase();
    if (role !== "admin" && role !== "manager") {
      return new Response(JSON.stringify({ error: "Only admins and managers can import data" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ImportRequest = await req.json();
    if (!body.base64) {
      return new Response(JSON.stringify({ error: "Missing file data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dryRun = body.dryRun === true;

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(body.base64, { type: "base64" });
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse Excel file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creatorsSheet = workbook.Sheets["Creators"];
    const tasksSheet = workbook.Sheets["Tasks"];

    if (!creatorsSheet && !tasksSheet) {
      return new Response(
        JSON.stringify({ error: "Excel file must contain a 'Creators' and/or 'Tasks' sheet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const creatorsRows = creatorsSheet ? XLSX.utils.sheet_to_json<any>(creatorsSheet) : [];
    const tasksRows = tasksSheet ? XLSX.utils.sheet_to_json<any>(tasksSheet) : [];

    const summary: Summary = {
      creators: { created: 0, updated: 0, skipped: 0 },
      tasks: { created: 0, updated: 0, skipped: 0 },
      errors: [],
      dryRun,
    };

    // Creators processed fully before Tasks: a recurring import commonly
    // includes a new creator plus their first batch of tasks in one file.
    const usernameToId = await processCreators(adminClient, creatorsRows, dryRun, summary);
    await processTasks(adminClient, tasksRows, usernameToId, dryRun, summary);

    return new Response(JSON.stringify({ data: summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
