import AdminNewClient from "./new-client";

export function generateStaticParams() {
  return [
    { type: "calligraphy" },
    { type: "photography" },
    { type: "reflections" },
  ];
}

export default function AdminNewPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  return <AdminNewClient params={params} />;
}
