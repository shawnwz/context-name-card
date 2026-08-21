import { auth } from "../../auth";
import { Header } from "../../components/header";
import { Sidebar } from "../../components/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  return (
    <div className="lg:flex min-h-svh">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
