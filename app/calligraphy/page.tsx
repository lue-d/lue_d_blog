import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentList } from "@/lib/content";

export default function CalligraphyPage() {
  const items = getContentList("calligraphy");

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
            书法集
          </h1>
          <p className="text-ink-muted dark:text-ink-dark-muted mt-3">
            笔墨之间，见字如面
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState type="书法作品" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/calligraphy/${item.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-3">
                  {item.cover ? (
                    <Image
                      src={item.cover}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted">
                      暂无图片
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-semibold group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
                  {item.title}
                </h2>
                {item.year && (
                  <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1">
                    {item.year}{item.medium ? ` · ${item.medium}` : ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-24">
      <p className="text-ink-muted dark:text-ink-dark-muted mb-2">
        还没有{type}
      </p>
      <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
        在 content/calligraphy/ 目录下添加 .mdx 文件即可
      </p>
    </div>
  );
}
