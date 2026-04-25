import { redirect } from "next/navigation";

import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { WorkspaceTopbar } from "@/components/layout/WorkspaceTopbar";
import { getServerAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const workspaceUser = {
    id: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
    name: session.user.name ?? session.user.email ?? "Workspace User",
    email: session.user.email ?? "",
  };

  return (
    <div className="workspace-bg relative min-h-screen overflow-hidden bg-transparent">
      <div className="noise-overlay" />
      <div className="relative mx-auto flex min-h-screen max-w-[1720px] gap-4 px-3 py-3 sm:px-5 lg:gap-5 lg:px-6">
        <WorkspaceSidebar user={workspaceUser} />
        <div className="flex min-h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col gap-4 lg:gap-5">
          <WorkspaceTopbar user={workspaceUser} />
          <main className="fade-up flex-1 pb-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
