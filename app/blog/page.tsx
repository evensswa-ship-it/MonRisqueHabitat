import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { MrhLogo } from "@/components/brand/mrh-logo";

export const metadata: Metadata = {
  title: "Blog | Mon Risque Habitat",
  description: "Guides sur l'analyse de risques habitat pour courtiers et professionnels de l'assurance : inondation, argiles, séisme, radon.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="shell py-12 md:py-16">
      <header className="mb-4">
        <Link href="/" aria-label="Accueil Mon Risque Habitat">
          <MrhLogo className="h-8 w-auto" />
        </Link>
      </header>

      <div className="mt-12 max-w-2xl">
        <p className="eyebrow">Blog</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[var(--brand-ink)] sm:text-4xl">
          Analyse de risques habitat
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-500">
          Guides pratiques pour qualifier les risques, préparer le conseil assurance et structurer une synthèse DDA.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="panel-card block h-full p-6 transition-shadow hover:shadow-md">
              {post.category && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
                  {post.category}
                </p>
              )}
              <h2 className="font-serif text-lg font-semibold text-[var(--brand-ink)]">
                {post.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{post.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-[var(--brand)]">
                Lire l'article →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 && (
        <p className="mt-12 text-sm text-slate-400">Aucun article pour le moment.</p>
      )}
    </div>
  );
}
