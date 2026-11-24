import { LESSONS } from "@/lib/lessons";

// Lessons carry no one-line goal of their own; their first sentence serves as one on the hub lists. No new copy.
// A lesson with no idea text gets no goal line; GuideList renders the title alone.
export const lessonItems = LESSONS.map((l) => ({
  slug: l.slug,
  title: l.title,
  goal: l.idea[0]?.split(/(?<=[.!?])\s+(?=[A-Z“"])/)[0] || undefined,
}));
