import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/session";
import Sidebar from "@/app/components/Sidebar";
import StatistikaPageClient from "./StatistikaPageClient";

export default async function StatistikaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("todo_session")?.value;
  const sessionUser = verifySessionToken(token);

  if (!sessionUser) {
    redirect("/prijava");
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,199,180,0.65),transparent_44%),radial-gradient(circle_at_85%_6%,rgba(185,233,220,0.7),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,244,237,0.98))]" />

      <Sidebar />

      <main className="relative flex-1 flex min-h-screen flex-col overflow-y-auto px-6 py-12 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 shadow-[0_22px_55px_-38px_rgba(29,37,51,0.45)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Pregled
            </p>
            <h1 className="font-display mt-1 text-2xl">Statistika opravil</h1>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-[var(--line)] bg-white px-5 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
            >
              Odjava
            </button>
          </form>
        </header>

        <StatistikaPageClient />
      </main>
    </div>
  );
}
