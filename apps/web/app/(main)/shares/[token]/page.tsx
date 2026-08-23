import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { ShareDetailPanel } from "../../../../components/share-detail-panel";

export default async function ShareDetailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { token } = await params;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
      <Link
        href="/shares"
        className="text-sm text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors"
      >
        ← Shared links
      </Link>
      <ShareDetailPanel userId={session.user.id} token={token} />
    </main>
  );
}
