import { Suspense } from "react";
import AdminEditClient from "./edit-client";

export function generateStaticParams() {
  return [
    { type: "calligraphy" },
    { type: "photography" },
    { type: "reflections" },
  ];
}

export default function AdminEditPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="text-center py-24">
          <p className="text-ink-muted text-sm">加载中...</p>
        </div>
      }
    >
      <AdminEditClient params={params} />
    </Suspense>
  );
}
