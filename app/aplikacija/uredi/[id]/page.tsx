"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import { useEffect, useState, type FormEvent } from "react";

type OpraviloResponse = {
  id: number;
  naslov: string;
  opis: string | null;
  od: string;
  do: string;
  kolikokrat: string;
};

type FormState = {
  naslov: string;
  opis: string;
  odKdaj: string;
  doKdaj: string;
  ponavljanje: string;
};

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function UrediOpraviloPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    naslov: "",
    opis: "",
    odKdaj: "",
    doKdaj: "",
    ponavljanje: "samo_enkrat",
  });

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;

      try {
        setLoading(true);
        setSubmitError(null);

        const response = await fetch(`/api/opravila/${taskId}`);
        const result = (await response.json().catch(() => null)) as
          | { opravilo?: OpraviloResponse; error?: string }
          | null;

        if (!response.ok || !result?.opravilo) {
          setSubmitError(result?.error || "Napaka pri pridobivanju opravila");
          return;
        }

        setFormData({
          naslov: result.opravilo.naslov ?? "",
          opis: result.opravilo.opis ?? "",
          odKdaj: toDateTimeLocalValue(result.opravilo.od),
          doKdaj: toDateTimeLocalValue(result.opravilo.do),
          ponavljanje: result.opravilo.kolikokrat ?? "samo_enkrat",
        });
      } catch {
        setSubmitError("Napaka pri povezavi s streznikom");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const getMinDateTimeForDo = () => {
    if (!formData.odKdaj) {
      return undefined;
    }
    return formData.odKdaj;
  };

  const isValidDateOrder = (odKdaj: string, doKdaj: string) => {
    const odKdajTime = new Date(odKdaj).getTime();
    const doKdajTime = new Date(doKdaj).getTime();

    if (Number.isNaN(odKdajTime) || Number.isNaN(doKdajTime)) {
      return false;
    }

    return doKdajTime > odKdajTime;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!taskId) {
      setSubmitError("Manjka ID opravila");
      return;
    }

    if (!formData.naslov.trim() || !formData.odKdaj || !formData.doKdaj) {
      setSubmitError("Naslov, od kdaj in do kdaj so obvezni");
      return;
    }

    if (!isValidDateOrder(formData.odKdaj, formData.doKdaj)) {
      setSubmitError("Neveljaven datum");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/opravila/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setSubmitError(result?.error || "Napaka pri posodabljanju opravila");
        return;
      }

      router.push("/aplikacija");
    } catch {
      setSubmitError("Napaka pri povezavi s streznikom");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitError(null);

    if (!taskId) {
      setSubmitError("Manjka ID opravila");
      return;
    }

    const confirmed = window.confirm("Ali res želiš izbrisati ta dogodek?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/opravila/${taskId}`, {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setSubmitError(result?.error || "Napaka pri brisanju opravila");
        return;
      }

      router.push("/aplikacija");
    } catch {
      setSubmitError("Napaka pri povezavi s streznikom");
    } finally {
      setIsDeleting(false);
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
              Urejanje opravila
            </p>
            <h1 className="font-display mt-1 text-2xl">Spremeni opravilo</h1>
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
          {loading ? (
            <p className="text-center text-[var(--muted)]">Nalagam opravilo...</p>
          ) : (
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
                    value={formData.odKdaj}
                    onChange={(e) => {
                      const newOdKdaj = e.target.value;
                      setFormData((prev) => {
                        const updated = { ...prev, odKdaj: newOdKdaj };
                        if (
                          updated.doKdaj &&
                          !isValidDateOrder(newOdKdaj, updated.doKdaj)
                        ) {
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
                    onChange={(e) => {
                      const newDoKdaj = e.target.value;

                      if (newDoKdaj && formData.odKdaj && !isValidDateOrder(formData.odKdaj, newDoKdaj)) {
                        setSubmitError("Do kdaj mora biti po Od kdaj");
                        return;
                      }

                      setSubmitError(null);
                      setFormData((prev) => ({
                        ...prev,
                        doKdaj: newDoKdaj,
                      }));
                    }}
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
                  disabled={isSubmitting || isDeleting}
                  className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? "Shranjujem..." : "Posodobi opravilo"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="rounded-full border border-red-300 bg-red-50 px-6 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleting ? "Brišem..." : "Izbriši dogodek"}
                </button>
                <Link
                  href="/aplikacija"
                  className="rounded-full border border-[var(--line)] bg-white px-6 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                >
                  Preklic
                </Link>
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
