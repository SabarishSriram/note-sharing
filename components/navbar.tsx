// Top navigation bar
// - Left: placeholder for SRM logo
// - Center: App name
// - Right: user email + logout button when authenticated

import Link from "next/link";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <Image
            src="/srm%20logo.webp"
          alt="SRM Logo"
          width={40}
          height={40}
          className="rounded-full bg-[#0C4B9C]/10"
        />
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          SRM Note Share
        </Link>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-700">
        {session?.user ? (
          <>
            <span className="hidden text-sm text-slate-600 sm:inline">
              {(session.user as any).email}
            </span>
            <form method="post" action="/api/auth/signout">
              <input type="hidden" name="callbackUrl" value="/" />
              <Button type="submit" variant="secondary">
                Logout
              </Button>
            </form>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-700 hover:text-[#0C4B9C]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm text-slate-700 hover:text-[#0C4B9C]"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
