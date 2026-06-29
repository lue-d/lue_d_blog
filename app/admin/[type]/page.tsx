import AdminListClient from "./list-client";

export function generateStaticParams() {
  return [
    { type: "calligraphy" },
    { type: "photography" },
    { type: "reflections" },
  ];
}

export default function AdminListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  return <AdminListClient params={params} />;
}
