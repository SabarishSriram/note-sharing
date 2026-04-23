"use client";

// Left sidebar for main app sections
// - Dashboard
// - Upload Notes
// - Reserved area for future AI Chat

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function SidebarLink({
  href,
  label,
  icon,
  disabled = false,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const base =
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors";

  if (disabled) {
    return (
      <div
        className={`${base} cursor-not-allowed text-slate-400 hover:bg-transparent`}
      >
        {icon && (
          <span className="mr-2 flex h-4 w-4 items-center justify-center opacity-60">
            {icon}
          </span>
        )}
        {label} (coming soon)
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${
        isActive
          ? "bg-[#0C4B9C]/10 text-[#0C4B9C]"
          : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {icon && (
        <span className="mr-2 flex h-4 w-4 items-center justify-center">
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-slate-500"
    >
      <path
        d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h5v7H4v-7zm9-3h7v10h-7V10z"
        fill="currentColor"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-slate-500"
    >
      <path
        d="M5 20h14v-2H5v2zm7-16l-5 5h3v4h4v-4h3l-5-5z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-slate-400"
    >
      <path
        d="M4 4h16v9H7l-3 3V4zm3 5h6v2H7V9zm0-3h10v2H7V6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-56 border-r border-slate-200 bg-slate-50/80 p-4 text-sm md:block">
      <nav className="space-y-1">
        <SidebarLink
          href="/dashboard"
          label="Dashboard"
          icon={<DashboardIcon />}
        />
        <SidebarLink
          href="/upload"
          label="Upload Notes"
          icon={<UploadIcon />}
        />
      </nav>
    </aside>
  );
}
