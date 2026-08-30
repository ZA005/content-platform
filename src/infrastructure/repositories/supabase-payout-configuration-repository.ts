import type { PayoutConfigurationRepository } from "@/core/interfaces/repositories";
import type { PayoutConfiguration } from "@/core/types";
import { getSupabaseClient } from "@/infrastructure/supabase/supabase-client";

interface PayoutConfigRow {
  id: string;
  payout_day_of_month: number;
  default_day_off_multiplier: number;
  default_working_days: number[];
  role_defaults?: {
    creator?: { baseSalaryCentavos?: number; dayOffMultiplier?: number };
    manager?: { baseSalaryCentavos?: number; dayOffMultiplier?: number };
  };
  updated_at: string;
}

function rowToPayoutConfiguration(row: PayoutConfigRow): PayoutConfiguration {
  return {
    payoutDayOfMonth: row.payout_day_of_month,
    defaultDayOffMultiplier: row.default_day_off_multiplier,
    defaultWorkingDays: row.default_working_days,
    roleDefaults: {
      creator: row.role_defaults?.creator ?? {},
      manager: row.role_defaults?.manager ?? {},
    },
    updatedAt: row.updated_at,
  };
}

const DEFAULT_CONFIG: PayoutConfiguration = {
  payoutDayOfMonth: 15,
  defaultDayOffMultiplier: 1.5,
  defaultWorkingDays: [1, 2, 3, 4, 5],
  roleDefaults: {
    creator: {},
    manager: {},
  },
  updatedAt: new Date().toISOString(),
};

export class SupabasePayoutConfigurationRepository implements PayoutConfigurationRepository {
  async get(): Promise<PayoutConfiguration> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("payout_configurations").select("*").limit(1).single();

    if (error) {
      if (error.code === "PGRST116") {
        return DEFAULT_CONFIG;
      }
      throw error;
    }

    return data ? rowToPayoutConfiguration(data) : DEFAULT_CONFIG;
  }

  async update(input: Partial<PayoutConfiguration>): Promise<PayoutConfiguration> {
    const supabase = getSupabaseClient();
    const current = await this.get();

    const updated: PayoutConfiguration = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("payout_configurations").upsert(
      {
        id: "default",
        payout_day_of_month: updated.payoutDayOfMonth,
        default_day_off_multiplier: updated.defaultDayOffMultiplier,
        default_working_days: updated.defaultWorkingDays,
        role_defaults: updated.roleDefaults,
        updated_at: updated.updatedAt,
      },
      { onConflict: "id" }
    );

    if (error) throw error;
    return updated;
  }
}

export const supabasePayoutConfigurationRepository = new SupabasePayoutConfigurationRepository();
