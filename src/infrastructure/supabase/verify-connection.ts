import { getSupabaseClient } from "./supabase-client";

export async function verifySupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // Test 1: Verify auth service is accessible
    const { error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("❌ Supabase auth service error:", sessionError.message);
      return false;
    }

    // Test 2: Verify RPC endpoint is accessible (resolve_login_email is used in login)
    const { error: rpcError } = await supabase.rpc("resolve_login_email", {
      p_username: "admin",
    });

    if (rpcError) {
      console.error("❌ Supabase RPC endpoint error:", rpcError.message);
      return false;
    }

    // Test 3: Try a simple table query to verify database connectivity
    const { error: dbError } = await supabase.from("profiles").select("count").limit(1);

    if (dbError) {
      console.error("❌ Supabase database error:", dbError.message);
      return false;
    }

    console.log("✓ Supabase backend connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to verify Supabase backend connection:", error);
    return false;
  }
}