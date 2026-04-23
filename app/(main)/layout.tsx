import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=Please+log+in");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
