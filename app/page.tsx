import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentList } from "@/lib/content-supabase";

export default async function Home() {
  const calligraphies = (await getContentList("calligraphy")).slice(0, 3);
  const photos = (await getContentList("photography")).slice(0, 3);
  const reflections = (await getContentList("reflections")).slice(0, 3);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-serif)] tracking-wider mb-6">
            墨韵
          </h1>
          <p className="text-lg md:text-xl text-ink-muted dark:text-ink-dark-muted max-w-lg mx-auto leading-relaxed">
            用笔墨书写心境，用镜头捕捉光影，<br />
            在流淌的时光里，记录每一次感悟。
          </p>
        </section>

        {/* 书法精选 */}
        {calligraphies.length > 0 && (
          <Section title="书法精选" href="/calligraphy">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {calligraphies.map((item) => (
                <Card key={item.slug} item={item} href={`/calligraphy/${item.slug}`} />
              ))}
            </div>
          </Section>
        )}

        {/* 摄影精选 */}
        {photos.length > 0 && (
          <Section title="摄影精选" href="/photography">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {photos.map((item) => (
                <Card key={item.slug} item={item} href={`/photography/${item.slug}`} />
              ))}
            </div>
          </Section>
        )}

        {/* 最新感悟 */}
        {reflections.length > 0 && (
          <Section title="最新感悟" href="/reflections">
            <div className="space-y-6 max-w-2xl mx-auto">
              {reflections.map((item) => (
                <Link
                  key={item.slug}
                  href={`/reflections/${item.slug}`}
                  className="block group"
                >
                  <article className="py-4 border-b border-ink-border dark:border-ink-dark-muted/20 last:border-0">
                    <time className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      {item.date}
                    </time>
                    <h3 className="text-lg font-semibold mt-1 group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* 空状态引导 — 无内容时显示 */}
        {calligraphies.length === 0 && photos.length === 0 && reflections.length === 0 && (
          <section className="max-w-2xl mx-auto px-6 pb-32 text-center">
            <p className="text-ink-muted dark:text-ink-dark-muted mb-4">
              内容还在准备中，先去添加一些作品吧
            </p>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              在管理后台中创建内容即可自动展示
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

/* ===== 内部组件 ===== */

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
          {title}
        </h2>
        <Link
          href={href}
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          查看全部 →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Card({
  item,
  href,
}: {
  item: { slug: string; title: string; description: string; cover?: string | null };
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-3">
        {item.cover ? (
          <Image
            src={item.cover}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm">
            暂无图片
          </div>
        )}
      </div>
      <h3 className="text-base font-semibold group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
        {item.title}
      </h3>
      <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1 line-clamp-2">
        {item.description}
      </p>
    </Link>
  );
}
