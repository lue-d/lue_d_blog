import Link from "next/link";
import AdminLink from "./AdminLink";

const NAV_ITEMS = [
  { href: "/calligraphy", label: "书法" },
  { href: "/photography", label: "摄影" },
  { href: "/reflections", label: "感悟" },
  { href: "/about", label: "关于" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-ink-paper/90 backdrop-blur-sm border-b border-ink-border dark:bg-ink-dark-bg/90 dark:border-ink-dark-muted/20">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
        <div className="flex items-center">
          <Link
            href="/"
            className="text-xl font-bold font-[family-name:var(--font-serif)] tracking-wider text-ink-text hover:text-ink-accent transition-colors dark:text-ink-dark-text"
          >
            与墨言
          </Link>
          <AdminLink />
        </div>
        <div className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm tracking-wide text-ink-muted hover:text-ink-accent transition-colors dark:text-ink-dark-muted dark:hover:text-ink-dark-text"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
