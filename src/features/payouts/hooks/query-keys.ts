export const payoutKeys = {
  all: ["payouts"] as const,
  daily: () => [...payoutKeys.all, "daily"] as const,
  month: (month: string) => [...payoutKeys.daily(), month] as const,
};

export const compensationKeys = {
  all: ["compensation"] as const,
  lists: () => [...compensationKeys.all, "list"] as const,
  list: () => [...compensationKeys.lists()] as const,
};

export const workScheduleKeys = {
  all: ["workSchedule"] as const,
  lists: () => [...workScheduleKeys.all, "list"] as const,
  list: () => [...workScheduleKeys.lists()] as const,
};

export const payoutConfigurationKeys = {
  all: ["payoutConfiguration"] as const,
  detail: () => [...payoutConfigurationKeys.all, "detail"] as const,
};

export const myPayoutKeys = {
  all: ["myPayout"] as const,
  month: (month: string) => [...myPayoutKeys.all, "month", month] as const,
};
