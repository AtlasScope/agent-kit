import { LESSONS } from "@/lib/lessons";

// Lessons carry no one-line goal of their own; their first sentence serves as one on the hub lists. No new copy.
export const lessonItems = LESSONS.map((l) => ({ slug: l.slug, title: l.title, goal: l.idea[0].split(/(?<=\.)\s/)[0] }));
