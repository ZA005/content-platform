export const managerKeys = {
  all: ["managers"] as const,
  lists: () => [...managerKeys.all, "list"] as const,
  list: () => [...managerKeys.lists()] as const,
};
