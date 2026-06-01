import { signIn } from "../auth";

export function SignIn() {
  return (
    <form
      action={async (formData) => {
        "use server";
        await signIn("resend", formData);
      }}
      className="flex flex-col gap-3 w-full max-w-sm"
    >
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        required
        className="border border-black/15 dark:border-white/15 rounded-lg px-4 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/30 dark:placeholder:text-white/30"
      />
      <button
        type="submit"
        className="bg-[var(--foreground)] text-[var(--background)] rounded-lg px-4 py-2.5 text-sm font-medium cursor-pointer hover:opacity-85 transition-opacity"
      >
        Sign in with Email
      </button>
    </form>
  );
}
