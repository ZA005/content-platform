export const creatorKeys = {
  all: ["creators"] as const,
  lists: () => [...creatorKeys.all, "list"] as const,
  list: () => [...creatorKeys.lists()] as const,
};
