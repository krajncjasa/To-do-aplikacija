"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Opravilo {
  id: number;
  naslov: string;
  opis: string | null;
  od: string;
  do: string;
  kolikokrat: string;
  vrsta: string | null;
  opravljeno: boolean;
  created_at: string;
}

type RawOpravilo = Omit<Opravilo, "opravljeno"> & {
  opravljeno: boolean | string | number | null;
};

export default function StatistikaPageClient() {
  const [loading, setLoading] = useState(true);
  const [soloTasks, setSoloTasks] = useState<Opravilo[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAndCalculate();
  }, []);

  const parseOpravljeno = (value: RawOpravilo["opravljeno"]) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "true" || normalized === "1";
    }
    if (typeof value === "number") return value === 1;
    return false;
  };

  const normalizeOpravilo = (raw: RawOpravilo): Opravilo => ({
    ...raw,
    opravljeno: parseOpravljeno(raw.opravljeno),
  });

  const fetchAndCalculate = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/opravila");
      if (response.ok) {
        const data = await response.json();
        const rawOpravila: RawOpravilo[] = Array.isArray(data.opravila)
          ? (data.opravila as RawOpravilo[])
          : [];
        const normalized = rawOpravila.map((item) => normalizeOpravilo(item));

        // Filtriraj samo "samo_enkrat" opravila
        const solo = normalized.filter(
          (op) => op.kolikokrat === "samo_enkrat" && op.vrsta !== "klon"
        );

        setSoloTasks(solo);
        setTotalCount(solo.length);

        const completed = solo.filter((op) => op.opravljeno).length;
        setCompletedCount(completed);
      }
    } catch (err) {
      console.error("Napaka pri pridobivanju opravil:", err);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const incompletionPercentage = 100 - completionPercentage;

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-2">
      {/* Povzetek */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-10 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)]">
        <h2 className="font-display mb-6 text-xl">Povzetek opravil "Samo enkrat"</h2>

        {loading ? (
          <p className="text-center text-[var(--muted)]">Nalagam...</p>
        ) : totalCount === 0 ? (
          <p className="text-center text-[var(--muted)]">
            Nisi ustvaril še nobenih opravil "Samo enkrat"
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Opravljenih
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  {completionPercentage}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {completedCount} od {totalCount} opravil
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Neopravljenih
                </span>
                <span className="text-lg font-bold text-amber-600">
                  {incompletionPercentage}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${incompletionPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {totalCount - completedCount} od {totalCount} opravil
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statistika kartic */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-10 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)]">
        <h2 className="font-display mb-6 text-xl">Pregled</h2>

        {loading ? (
          <p className="text-center text-[var(--muted)]">Nalagam...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                Opravljenih
              </p>
              <p className="font-display mt-2 text-3xl text-emerald-600">
                {completedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">
                Neopravljenih
              </p>
              <p className="font-display mt-2 text-3xl text-amber-600">
                {totalCount - completedCount}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">
                Skupno
              </p>
              <p className="font-display mt-2 text-3xl text-blue-600">
                {totalCount}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Opravila */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-10 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)] lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl">Opravila "Samo enkrat"</h2>
          <Link
            href="/aplikacija/novo"
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
          >
            + Novo
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-[var(--muted)]">Nalagam opravila...</p>
        ) : soloTasks.length === 0 ? (
          <p className="text-center text-[var(--muted)]">Ni opravil</p>
        ) : (
          <div className="space-y-2">
            {soloTasks.map((opravilo) => (
              <div
                key={opravilo.id}
                className={`rounded-xl border p-3 transition-all ${
                  opravilo.opravljeno
                    ? "border-emerald-200 bg-emerald-50/95"
                    : "border-[var(--line)] bg-white/50 hover:border-[var(--accent)] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <label className="group inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={opravilo.opravljeno}
                      readOnly
                      className="peer sr-only"
                    />
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg border border-[var(--line)] bg-white/90 text-white shadow-[0_8px_18px_-12px_rgba(29,37,51,0.55)] transition-all duration-200 peer-checked:border-green-500 peer-checked:bg-green-500">
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 scale-75 opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
                      >
                        <path
                          d="M3.2 8.2 6.7 11.4 12.8 4.9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </label>
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate text-sm font-semibold ${opravilo.opravljeno ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                      {opravilo.naslov}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      📅 {new Date(opravilo.od).toLocaleDateString("sl-SI")} - {new Date(opravilo.do).toLocaleDateString("sl-SI")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
