import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full max-w-full">
      <div className="flex-1 pb-24 w-full max-w-full overflow-x-hidden">{children}</div>
      <BottomNav />
    </div>
  );
}
