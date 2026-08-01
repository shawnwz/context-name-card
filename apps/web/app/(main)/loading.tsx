import { Spinner } from "../../components/spinner";

export default function Loading() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex items-center justify-center min-h-[50vh]">
      <Spinner className="h-6 w-6 text-black/40 dark:text-white/40" />
    </main>
  );
}
