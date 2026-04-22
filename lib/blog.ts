import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  title: string;
  description: string;
  slug: string;
  content: string;
};

export type BlogPostMeta = Omit<BlogPost, "content">;

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const source = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
      const { data } = matter(source);
      return {
        title: data.title as string,
        description: data.description as string,
        slug: (data.slug as string) ?? file.replace(".md", ""),
      };
    });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);

  return {
    title: data.title as string,
    description: data.description as string,
    slug: (data.slug as string) ?? slug,
    content,
  };
}
