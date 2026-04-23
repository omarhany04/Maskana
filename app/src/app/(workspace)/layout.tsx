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
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <WorkspaceSidebar user={workspaceUser} />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-6">
          <WorkspaceTopbar user={workspaceUser} />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
