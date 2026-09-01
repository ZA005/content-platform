import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatorRow {
  id: string;
  name: string;
  username: string;
  status: string;
  brands: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskRow {
  id: string;
  creator_id: string;
  scheduled_date: string;
  brand: string;
  script_link: string;
  reference_link: string | null;
  instruction: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function buildWorkbook(creators: CreatorRow[], tasks: TaskRow[]): string {
  const workbook = XLSX.utils.book_new();

  const creatorsData = creators.map((c) => ({
    ID: c.id,
    Name: c.name,
    Username: c.username,
    Status: c.status,
    Brands: (c.brands || []).join("; "),
    "Avatar URL": c.avatar_url || "",
    "Created At": c.created_at,
    "Updated At": c.updated_at,
  }));

  const tasksData = tasks.map((t) => ({
    ID: t.id,
    "Creator ID": t.creator_id,
    "Scheduled Date": t.scheduled_date,
    Brand: t.brand,
    "Script Link": t.script_link,
    "Reference Link": t.reference_link || "",
    Instruction: t.instruction,
    Notes: t.notes,
    Status: t.status,
    "Created At": t.created_at,
    "Updated At": t.updated_at,
  }));

  const creatorsSheet = XLSX.utils.json_to_sheet(creatorsData);
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);

  XLSX.utils.book_append_sheet(workbook, creatorsSheet, "Creators");
  XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");

  return XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
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
      return new Response(JSON.stringify({ error: "Only admins and managers can export data" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: creators, error: creatorsError }, { data: tasks, error: tasksError }] = await Promise.all([
      adminClient.from("creators").select("*").order("name", { ascending: true }),
      adminClient.from("tasks").select("*").order("scheduled_date", { ascending: true }),
    ]);

    if (creatorsError) {
      return new Response(JSON.stringify({ error: creatorsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tasksError) {
      return new Response(JSON.stringify({ error: tasksError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base64 = buildWorkbook(creators || [], tasks || []);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `content-platform-export-${timestamp}.xlsx`;

    return new Response(JSON.stringify({ data: { base64, filename } }), {
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
