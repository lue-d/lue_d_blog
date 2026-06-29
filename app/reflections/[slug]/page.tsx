import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentData, getContentList } from "@/lib/content-supabase";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const items = await getContentList("reflections");
  return items.map((item) => ({ slug: item.slug }));
}

export default async function ReflectionDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getContentData("reflections", slug);
  if (!data) notFound();

  const { meta, html } = data;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link
          href="/reflections"
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          ← 返回感悟
        </Link>

        <article className="mt-8">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
              {meta.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-ink-muted dark:text-ink-dark-muted">
              {meta.date && <time>{meta.date}</time>}
              {meta.category && (
                <>
                  <span className="text-ink-border">|</span>
                  <span>{meta.category}</span>
                </>
              )}
            </div>
          </header>

          {meta.cover && (
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-ink-border/30 mb-10">
              <Image
                src={meta.cover}
                alt={meta.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </main>
      <Footer />
    </>
  );
}
