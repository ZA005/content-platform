import { CREATOR_STATUS, TASK_STATUS } from "@/core/constants";
import type { Creator, Task } from "@/core/types";

function isoDaysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function timestamp(): string {
  return new Date().toISOString();
}

export function buildSeedCreators(): Creator[] {
  const now = timestamp();
  const base: Array<Omit<Creator, "id" | "createdAt" | "updatedAt">> = [
    {
      name: "Maya Torres",
      username: "maya",
      password: "creator123",
      status: CREATOR_STATUS.ACTIVE,
      brands: ["Nike", "Adidas"],
      avatarUrl: "",
    },
    {
      name: "Jordan Lee",
      username: "jordan",
      password: "creator123",
      status: CREATOR_STATUS.ACTIVE,
      brands: ["Nike", "Puma"],
      avatarUrl: "",
    },
    {
      name: "Priya Nair",
      username: "priya",
      password: "creator123",
      status: CREATOR_STATUS.ACTIVE,
      brands: ["Puma", "Adidas"],
      avatarUrl: "",
    },
    {
      name: "Sam Okafor",
      username: "sam",
      password: "creator123",
      status: CREATOR_STATUS.DISABLED,
      brands: ["Nike"],
      avatarUrl: "",
    },
  ];

  return base.map((c, i) => ({
    ...c,
    id: `creator-${i + 1}`,
    createdAt: now,
    updatedAt: now,
  }));
}

export function buildSeedTasks(creators: Creator[]): Task[] {
  const now = timestamp();
  const [maya, jordan, priya] = creators;

  const rows: Array<Omit<Task, "id" | "createdAt" | "updatedAt">> = [
    {
      creatorId: maya.id,
      brand: "Nike",
      scheduledDate: isoDaysFromToday(0),
      scriptLink: "https://docs.example.com/scripts/product-launch-hook",
      instruction: "Record the 3 hook variants for the product launch reel. Match the pacing of last week's top performer.",
      notes: "Use the new studio backdrop. Wardrobe: neutral tones.",
      status: TASK_STATUS.IN_PROGRESS,
    },
    {
      creatorId: maya.id,
      brand: "Adidas",
      scheduledDate: isoDaysFromToday(0),
      scriptLink: "https://docs.example.com/scripts/day-in-the-life",
      instruction: "Shoot the day-in-the-life B-roll segments listed in the shot list, section 2 only.",
      notes: "",
      status: TASK_STATUS.NOT_STARTED,
    },
    {
      creatorId: jordan.id,
      brand: "Nike",
      scheduledDate: isoDaysFromToday(0),
      scriptLink: "https://docs.example.com/scripts/testimonial-cutdown",
      instruction: "Re-cut the client testimonial into a 30s vertical version with captions.",
      notes: "Deliver as MP4, 9:16, under 60MB.",
      status: TASK_STATUS.IN_REVIEW,
    },
    {
      creatorId: priya.id,
      brand: "Puma",
      scheduledDate: isoDaysFromToday(-1),
      scriptLink: "https://docs.example.com/scripts/faq-series-ep4",
      instruction: "Film FAQ series episode 4 using the updated question list.",
      notes: "Approved by legal — do not change wording of the disclaimer.",
      status: TASK_STATUS.COMPLETED,
    },
    {
      creatorId: priya.id,
      brand: "Adidas",
      scheduledDate: isoDaysFromToday(-2),
      scriptLink: "https://docs.example.com/scripts/behind-the-scenes",
      instruction: "Behind-the-scenes vlog covering the studio move.",
      notes: "Overdue — please prioritize today.",
      status: TASK_STATUS.OVERDUE,
    },
    {
      creatorId: jordan.id,
      brand: "Puma",
      scheduledDate: isoDaysFromToday(1),
      scriptLink: "https://docs.example.com/scripts/newsletter-teaser",
      instruction: "Record a 15s teaser for next week's newsletter drop.",
      notes: "",
      status: TASK_STATUS.NOT_STARTED,
    },
    {
      creatorId: maya.id,
      brand: "Nike",
      scheduledDate: isoDaysFromToday(2),
      scriptLink: "https://docs.example.com/scripts/season-recap",
      instruction: "Season recap montage — pull clips from the shared drive folder \"Q3 Highlights\".",
      notes: "Keep under 90 seconds.",
      status: TASK_STATUS.NOT_STARTED,
    },
  ];

  return rows.map((r, i) => ({
    ...r,
    id: `task-${i + 1}`,
    createdAt: now,
    updatedAt: now,
  }));
}
