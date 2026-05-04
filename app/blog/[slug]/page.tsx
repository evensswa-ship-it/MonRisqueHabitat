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
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          {post.category && <span>{post.category}</span>}
          {post.updatedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>Mis à jour le {new Date(post.updatedAt).toLocaleDateString("fr-FR")}</span>
            </>
          )}
        </div>

        <div
          className="blog-content mt-10 max-w-2xl"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {(post.related.length > 0 || post.sources.length > 0) && (
          <aside className="mt-12 grid max-w-2xl gap-4 md:grid-cols-2">
            {post.related.length > 0 && (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                  À lire aussi
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6">
                  {post.related.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-slate-600 underline-offset-4 hover:text-[var(--brand)] hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {post.sources.length > 0 && (
              <div className="rounded-[20px] border border-blue-100 bg-blue-50/50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                  Sources officielles
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6">
                  {post.sources.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-slate-600 underline-offset-4 hover:text-[var(--brand)] hover:underline">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}

        <div className="mt-16 max-w-2xl rounded-[24px] border border-blue-100 bg-[var(--brand-soft)] px-6 py-8 md:px-8 md:py-10">
          <p className="eyebrow mb-3 text-[var(--brand)]">Mon Risque Habitat</p>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
            Analysez les risques d&apos;un bien en quelques secondes
          </h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-slate-500">
            Entrez une adresse, obtenez une analyse de risques exploitable, puis structurez une synthèse DDA prête à relire.
          </p>
          <a href="/#analyser" className="cta-primary cta-md mt-6 inline-flex">
            Analyser une adresse →
          </a>
        </div>
      </article>
    </div>
  );
}
