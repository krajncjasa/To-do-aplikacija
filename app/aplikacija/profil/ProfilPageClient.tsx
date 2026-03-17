"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";

type ProfilPageProps = {
  sessionUser: {
    id: number;
    ime: string;
    priimek: string;
    eposta: string;
  };
};

export default function ProfilPageClient({ sessionUser }: ProfilPageProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    ime: sessionUser.ime,
    priimek: sessionUser.priimek,
    eposta: sessionUser.eposta,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.ime.trim().length < 2) {
      setError("Ime mora imeti vsaj 2 znaka");
      return;
    }

    if (formData.priimek.trim().length < 2) {
      setError("Priimek mora imeti vsaj 2 znaka");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.eposta.trim())) {
      setError("E-postni naslov ni veljaven");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Posodobljenje profila ni uspelo");
        return;
      }

      setSuccess(payload.message ?? "Profil je bil uspesno posodobljen");
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Napaka povezave s streznikom. Poskusi znova.");
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
              Moj profil
            </p>
            <h1 className="font-display mt-1 text-2xl">Tvoji podatki</h1>
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

        <section className="mt-8 max-w-4xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)]">
          {(error || success) && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                error
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
              aria-live="polite"
            >
              {error ? (
                <div className="space-y-1">
                  <p className="font-semibold">Pozor</p>
                  <p>{error}</p>
                </div>
              ) : (
                success
              )}
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Ime
                </p>
                <p className="mt-1 text-lg font-semibold">{sessionUser.ime}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Priimek
                </p>
                <p className="mt-1 text-lg font-semibold">{sessionUser.priimek}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  E-pošta
                </p>
                <p className="mt-1 text-lg font-semibold">{sessionUser.eposta}</p>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                >
                  Uredi profil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Ime
                </label>
                <input
                  type="text"
                  value={formData.ime}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, ime: event.target.value }))
                  }
                  placeholder="Vnesi ime"
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Priimek
                </label>
                <input
                  type="text"
                  value={formData.priimek}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      priimek: event.target.value,
                    }))
                  }
                  placeholder="Vnesi priimek"
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  E-pošta
                </label>
                <input
                  type="email"
                  value={formData.eposta}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      eposta: event.target.value,
                    }))
                  }
                  placeholder="Vnesi e-postni naslov"
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                >
                  {isSubmitting ? "Shranjevanje..." : "Shrani spremembe"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                    setFormData({
                      ime: sessionUser.ime,
                      priimek: sessionUser.priimek,
                      eposta: sessionUser.eposta,
                    });
                  }}
                  className="rounded-full border border-[var(--line)] bg-white px-6 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                >
                  Preklic
                </button>
              </div>
            </form>
          )}

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
