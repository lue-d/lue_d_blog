import AdminEditClient from "./edit-client";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ type: "_", id: "_" }];
}

export default function AdminEditPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  return <AdminEditClient params={params} />;
}
