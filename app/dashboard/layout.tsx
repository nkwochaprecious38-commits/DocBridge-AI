import { getContext } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await getContext();
  return (
    <div className="min-h-screen bg-mist lg:flex">
      <Sidebar orgName={org.name} email={user.email ?? ""} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
  );
}
