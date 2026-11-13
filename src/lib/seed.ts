import type { Collection, LinkItem } from "./types";

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export function seedCollections(): Collection[] {
  return [
    { id: "c-learning", name: "Learning", color: "#C8F560", created_at: ago(30) },
    { id: "c-design", name: "Design", color: "#B9A6FF", created_at: ago(29) },
    { id: "c-watch", name: "Watch later", color: "#FF7A6B", created_at: ago(28) },
  ];
}

type Seed = Pick<LinkItem, "id" | "url" | "title" | "type"> & Partial<LinkItem> & { days: number };

const seeds: Seed[] = [
  {
    id: "l-1",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
    title: "But what is a neural network?",
    description: "A visual introduction to how neural networks learn, from 3Blue1Brown.",
    site_name: "YouTube",
    type: "video",
    collection_id: "c-watch",
    tags: ["ai", "math"],
    is_favorite: true,
    days: 0.2,
  },
  {
    id: "l-2",
    url: "https://react.dev/learn",
    title: "Quick Start – React",
    description: "The official guide to the concepts you'll use every day in React.",
    site_name: "react.dev",
    type: "doc",
    collection_id: "c-learning",
    tags: ["react", "frontend"],
    notes: "Start with 'Thinking in React' before the hooks chapter.",
    days: 1,
  },
  {
    id: "l-3",
    url: "https://paulgraham.com/greatwork.html",
    title: "How to Do Great Work",
    description: "An essay on choosing what to work on and how to do it exceptionally well.",
    site_name: "Paul Graham",
    type: "article",
    tags: ["career", "essays"],
    is_favorite: true,
    days: 2,
  },
  {
    id: "l-4",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
    title: "CSS grid layout",
    description: "MDN reference for the two-dimensional grid layout system in CSS.",
    site_name: "MDN Web Docs",
    type: "doc",
    collection_id: "c-design",
    tags: ["css", "frontend"],
    days: 3,
  },
  {
    id: "l-5",
    url: "https://practicaltypography.com/",
    title: "Butterick's Practical Typography",
    description: "A free online book about typography for everyday writing and design.",
    site_name: "Practical Typography",
    type: "article",
    collection_id: "c-design",
    tags: ["typography", "design"],
    is_done: true,
    days: 5,
  },
  {
    id: "l-6",
    url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
    title: "Row Level Security | Supabase Docs",
    description: "Secure your data with Postgres Row Level Security policies.",
    site_name: "Supabase",
    type: "doc",
    collection_id: "c-learning",
    tags: ["database", "security"],
    days: 7,
  },
  {
    id: "l-7",
    url: "https://www.youtube.com/watch?v=PUv66718DII",
    title: "Bret Victor – Inventing on Principle",
    description: "A talk about creators needing an immediate connection to what they create.",
    site_name: "YouTube",
    type: "video",
    collection_id: "c-watch",
    tags: ["talks", "design"],
    days: 9,
  },
  {
    id: "l-8",
    url: "https://github.com/anthropics/skills",
    title: "anthropics/skills",
    description: "A public repository of reusable agent skills.",
    site_name: "GitHub",
    type: "other",
    tags: ["ai", "repo"],
    days: 12,
  },
];

export function seedLinks(): LinkItem[] {
  return seeds.map(({ days, ...s }) => ({
    description: null,
    image_url: null,
    favicon_url: null,
    site_name: null,
    collection_id: null,
    tags: [],
    notes: null,
    is_favorite: false,
    is_done: false,
    ...s,
    created_at: ago(days),
    updated_at: ago(days),
  }));
}
