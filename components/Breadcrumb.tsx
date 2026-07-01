import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string; // 无 href = 当前页，灰色不可点击
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="面包屑" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-ink-border dark:text-ink-dark-muted/40 select-none">
                ›
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-ink-muted hover:text-ink-accent transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-text dark:text-ink-dark-text font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
