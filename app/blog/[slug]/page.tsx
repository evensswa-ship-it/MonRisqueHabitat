import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { MrhLogo } from "@/components/brand/mrh-logo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Mon Risque Habitat`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = await marked(post.content);

  return (
    <div className="shell py-16">
      <header className="mb-4">
        <Link href="/" aria-label="Accueil Mon Risque Habitat">
          <MrhLogo className="h-8 w-auto" />
        </Link>
      </header>

      <nav className="mt-8 text-sm text-slate-400">
        <Link href="/blog" className="hover:text-[var(--brand)]">← Retour au blog</Link>
      </nav>

      <article className="mt-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-500">{post.description}</p>

        <div
          className="blog-content mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
