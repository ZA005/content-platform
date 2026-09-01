export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (options: Record<string, any> = {}) => [...taskKeys.lists(), options] as const,
  byDate: (date: string) => [...taskKeys.all, "byDate", date] as const,
  byCreator: (creatorId: string) => [...taskKeys.all, "byCreator", creatorId] as const,
  byCreatorAndDate: (creatorId: string, date: string) => [...taskKeys.byCreator(creatorId), date] as const,
};
