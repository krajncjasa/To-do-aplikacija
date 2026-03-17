"use client";

import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { useState, type FormEvent } from "react";

export default function NovoOpravilo() {
  const [formData, setFormData] = useState({
    naslov: "",
    opis: "",
    odKdaj: "",
    doKdaj: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Poslano:", formData);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,199,180,0.65),transparent_44%),radial-gradient(circle_at_85%_6%,rgba(185,233,220,0.7),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(247,244,237,0.98))]" />

      <Sidebar />

      <main className="relative flex-1 flex min-h-screen flex-col overflow-y-auto px-6 py-12 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 shadow-[0_22px_55px_-38px_rgba(29,37,51,0.45)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Novo opravilo
            </p>
            <h1 className="font-display mt-1 text-2xl">Ustvari novo opravilo</h1>
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

        <section className="mt-8 mx-auto w-11/12 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-10 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)]">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Naslov
              </label>
              <input
                type="text"
                value={formData.naslov}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, naslov: e.target.value }))
                }
                placeholder="Npr. Priprava predstavitve"
                className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Opis
              </label>
              <textarea
                value={formData.opis}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, opis: e.target.value }))
                }
                placeholder="Opiši kaj moraš narediti..."
                rows={4}
                className="rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Od kdaj
                </label>
                <input
                  type="datetime-local"
                  value={formData.odKdaj}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      odKdaj: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Do kdaj
                </label>
                <input
                  type="datetime-local"
                  value={formData.doKdaj}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      doKdaj: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
              >
                Ustvari opravilo
              </button>
              <Link
                href="/aplikacija"
                className="rounded-full border border-[var(--line)] bg-white px-6 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
              >
                Preklic
              </Link>
            </div>
          </form>

          <Link
            href="/aplikacija"
            className="mt-8 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            ← Nazaj na moja opravila
          </Link>
        </section>
      </main>
    </div>
  );
}
