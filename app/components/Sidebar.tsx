"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Moja opravila",
    href: "/aplikacija",
    icon: "📋",
  },
  {
    label: "Ustvari opravilo",
    href: "/aplikacija/novo",
    icon: "➕",
  },
  {
    label: "Statistika",
    href: "/aplikacija/statistika",
    icon: "📊",
  },
  {
    label: "Moj profil",
    href: "/aplikacija/profil",
    icon: "👤",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-[var(--line)] bg-[var(--surface)]">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-[var(--line)] px-6 py-8">
        <Link href="/aplikacija" className="flex items-center gap-3 transition-opacity hover:opacity-75">
          <Image
            src="/slike/logo.png"
            alt="To-do list logo"
            width={100}
            height={100}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[var(--accent)] text-white shadow-[0_8px_20px_-8px_rgba(219,91,63,0.4)]"
                  : "text-[var(--foreground)] hover:bg-[var(--surface-strong)] active:bg-[var(--accent-soft)]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--line)] px-4 py-6">
        <p className="text-xs uppercase tracking-[0.1em] text-[var(--muted)]">
          Verzija 1.0
        </p>
      </div>
    </aside>
  );
}
