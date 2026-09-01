import type { PayoutRepository } from "@/core/interfaces/repositories";
import type { FinalizedPayoutRecord, ID } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface PayoutRow {
  id: string;
  month: string;
  user_id: string;
  summary: FinalizedPayoutRecord["summary"];
  daily_breakdown: FinalizedPayoutRecord["dailyBreakdown"];
  created_at: string;
}

function rowToFinalizedPayoutRecord(row: PayoutRow): FinalizedPayoutRecord {
  return {
    summary: row.summary,
    dailyBreakdown: row.daily_breakdown,
  };
}

export class SupabasePayoutRepository implements PayoutRepository {
  async listByMonth(month: string): Promise<FinalizedPayoutRecord[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("finalized_payouts")
      .select("*")
      .eq("month", month)
      .order("user_id", { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToFinalizedPayoutRecord);
  }

  async getByUserAndMonth(userId: ID, month: string): Promise<FinalizedPayoutRecord | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("finalized_payouts")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();

    if (error) throw error;
    return data ? rowToFinalizedPayoutRecord(data) : null;
  }

  async finalizeMonth(month: string, records: FinalizedPayoutRecord[]): Promise<void> {
    const supabase = getSupabaseClient();

    // Delete existing records for this month
    const { error: deleteError } = await supabase
      .from("finalized_payouts")
      .delete()
      .eq("month", month);

    if (deleteError) throw deleteError;

    // Insert new records
    const rowsToInsert = records.map((record, index) => ({
      id: `payout-${month}-${record.summary.userId}-${index}`,
      month,
      user_id: record.summary.userId,
      summary: record.summary,
      daily_breakdown: record.dailyBreakdown,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from("finalized_payouts").insert(rowsToInsert);

    if (insertError) throw insertError;
  }

  async unfinalizeMonth(month: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("finalized_payouts").delete().eq("month", month);

    if (error) throw error;
  }
}

export const supabasePayoutRepository = new SupabasePayoutRepository();
