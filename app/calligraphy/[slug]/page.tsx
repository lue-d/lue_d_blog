import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentData } from "@/lib/content-supabase";

type Params = Promise<{ slug: string }>;

export default async function CalligraphyDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getContentData("calligraphy", slug);
  if (!data) notFound();

  const { meta, html } = data;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link
          href="/calligraphy"
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          ← 返回书法集
        </Link>

        <article className="mt-8">
          {meta.cover && (
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-8">
              <Image
                src={meta.cover}
                alt={meta.title}
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
            {meta.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-ink-muted dark:text-ink-dark-muted mb-8">
            {meta.year && <span>{meta.year}</span>}
            {meta.medium && <span>材质：{meta.medium}</span>}
            {meta.category && <span>书体：{meta.category}</span>}
          </div>

          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </main>
      <Footer />
    </>
  );
}
