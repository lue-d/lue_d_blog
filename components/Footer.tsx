export default function Footer() {
  return (
    <footer className="border-t border-ink-border dark:border-ink-dark-muted/20 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
          © {new Date().getFullYear()} 与墨言 · 用笔墨与镜头记录生活
        </p>
      </div>
    </footer>
  );
}
