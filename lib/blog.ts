import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  title: string;
  description: string;
  slug: string;
  category?: string;
  updatedAt?: string;
  sources: BlogLink[];
  related: BlogLink[];
  content: string;
};

export type BlogPostMeta = Omit<BlogPost, "content">;

export type BlogLink = {
  label: string;
  href: string;
};

function toLinks(value: unknown): BlogLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      if (typeof entry.label !== "string" || typeof entry.href !== "string") return null;
      return { label: entry.label, href: entry.href };
    })
    .filter((item): item is BlogLink => item !== null);
}

function readPostFile(file: string): BlogPost {
  const source = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
  const { data, content } = matter(source);

  return {
    title: data.title as string,
    description: data.description as string,
    slug: (data.slug as string) ?? file.replace(".md", ""),
    category: data.category as string | undefined,
    updatedAt: data.updatedAt as string | undefined,
    sources: toLinks(data.sources),
    related: toLinks(data.related),
    content,
  };
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readPostFile)
    .map(({ content: _content, ...meta }) => meta);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  if (!fs.existsSync(CONTENT_DIR)) return undefined;

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  return files.map(readPostFile).find((post) => post.slug === slug);
}
