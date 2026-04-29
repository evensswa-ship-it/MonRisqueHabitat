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
    title: `${post.title} | Mon Risque Habitat`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = await marked(post.content);

  return (
    <div className="shell py-12 md:py-16">
      <header className="mb-4">
        <Link href="/" aria-label="Accueil Mon Risque Habitat">
          <MrhLogo className="h-8 w-auto" />
        </Link>
      </header>

      <nav className="mt-8 text-sm text-slate-400">
        <Link href="/blog" className="hover:text-[var(--brand)]">← Retour au blog</Link>
      </nav>

      <article className="mt-8 max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">{post.description}</p>

        <div
          className="blog-content mt-10 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-16 max-w-2xl rounded-[24px] border border-blue-100 bg-[var(--brand-soft)] px-6 py-8 md:px-8 md:py-10">
          <p className="eyebrow mb-3 text-[var(--brand)]">Mon Risque Habitat</p>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
            Analysez les risques d&apos;un bien en quelques secondes
          </h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-slate-500">
            Entrez une adresse et obtenez une synthèse claire sur l'inondation, le sol, l'environnement et plus encore.
          </p>
          <a href="/#analyser" className="cta-primary cta-md mt-6 inline-flex">
            Analyser une adresse →
          </a>
        </div>
      </article>
    </div>
  );
}
