import type { PayoutRepository } from "@/core/interfaces/repositories";
import type { FinalizedPayoutRecord } from "@/core/types";
import { repositoryFactory } from "@/infrastructure/repositories/repository-factory";
import { payoutCalculationService } from "./payout-calculation-service";

export class PayoutService {
  #payoutRepository: PayoutRepository;

  constructor(payoutRepository: PayoutRepository) {
    this.#payoutRepository = payoutRepository;
  }

  async getPayoutsForMonth(month: string): Promise<FinalizedPayoutRecord[]> {
    return this.#payoutRepository.listByMonth(month);
  }

  async finalizeMonth(month: string): Promise<void> {
    const summaries = await payoutCalculationService.calculateMonthlyPayouts(month);
    const records = summaries.map((summary) => ({
      summary,
      dailyBreakdown: [], // TODO: calculate daily breakdown for each person
    }));
    await this.#payoutRepository.finalizeMonth(month, records);
  }

  async unfinalizeMonth(month: string): Promise<void> {
    await this.#payoutRepository.unfinalizeMonth(month);
  }
}

export const payoutService = new PayoutService(repositoryFactory.getPayoutRepository());
