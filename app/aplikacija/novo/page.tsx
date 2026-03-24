"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { useState, type FormEvent } from "react";

export default function NovoOpravilo() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    naslov: "",
    opis: "",
    odKdaj: "",
    doKdaj: "",
    ponavljanje: "samo_enkrat",
  });

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getMinDateTimeForDo = () => {
    if (!formData.odKdaj) {
      return getMinDateTime();
    }
    return formData.odKdaj;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!formData.naslov.trim() || !formData.odKdaj || !formData.doKdaj) {
      setSubmitError("Naslov, od kdaj in do kdaj so obvezni");
      return;
    }

    // Zaokroži "sedaj" na celo minuto (brez sekund/milisekund)
    const now = new Date();
    now.setSeconds(0, 0);
    const nowTime = now.getTime();

    const odKdajTime = new Date(formData.odKdaj).getTime();
    const doKdajTime = new Date(formData.doKdaj).getTime();

    if (odKdajTime < nowTime) {
      setSubmitError("Od kdaj ne sme biti v preteklosti");
      return;
    }

    if (doKdajTime < nowTime) {
      setSubmitError("Do kdaj ne sme biti v preteklosti");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/opravila", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setSubmitError(result?.error || "Napaka pri ustvarjanju opravila");
        return;
      }

      router.push("/aplikacija");
    } catch {
      setSubmitError("Napaka pri povezavi s streznikom");
    } finally {
      setIsSubmitting(false);
    }
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
            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </p>
            )}

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
                  min={getMinDateTime()}
                  value={formData.odKdaj}
                  onChange={(e) => {
                    const newOdKdaj = e.target.value;
                    setFormData((prev) => {
                      const updated = { ...prev, odKdaj: newOdKdaj };
                      if (updated.doKdaj && new Date(newOdKdaj).getTime() > new Date(updated.doKdaj).getTime()) {
                        updated.doKdaj = "";
                      }
                      return updated;
                    });
                  }}
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Do kdaj
                </label>
                <input
                  type="datetime-local"
                  min={getMinDateTimeForDo()}
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

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Ponavljanje
              </label>
              <select
                value={formData.ponavljanje}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ponavljanje: e.target.value,
                  }))
                }
                className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              >
                <option value="samo_enkrat">Samo enkrat</option>
                <option value="vsak_dan">Vsak dan</option>
                <option value="vsak_teden">Vsak teden</option>
                <option value="vsak_mesec">Vsak mesec</option>
                <option value="vsako_leto">Vsako leto</option>
              </select>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? "Shranjujem..." : "Ustvari opravilo"}
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
