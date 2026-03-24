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
  opravljeno: boolean;
  created_at: string;
}

type RawOpravilo = Omit<Opravilo, "opravljeno"> & {
  opravljeno: boolean | string | number | null;
};

export default function AplikacijaPageClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [opravila, setOpravila] = useState<Opravilo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterMode, setFilterMode] = useState<"ta_teden" | "vsi_dnevi" | "specifičen_dan">("ta_teden");

  useEffect(() => {
    fetchOpravila();
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

  const fetchOpravila = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/opravila");
      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data.opravila)
          ? data.opravila.map((item: RawOpravilo) => normalizeOpravilo(item))
          : [];
        setOpravila(normalized);
      }
    } catch (err) {
      console.error("Napaka pri pridobivanju opravil:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpravilo = async (
    id: number,
    trenutnoOpravljeno: boolean,
    novoOpravljeno: boolean
  ) => {

    // Takoj preklopi stanje v UI, da je drugi klik vedno možen (označi/odznači)
    setOpravila((prev) =>
      prev.map((op) =>
        op.id === id ? { ...op, opravljeno: novoOpravljeno } : op
      )
    );

    try {
      const response = await fetch(`/api/opravila/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opravljeno: novoOpravljeno }),
      });

      const result = (await response.json().catch(() => null)) as
        | { opravilo?: { id: number; opravljeno: boolean | string | number | null }; error?: string }
        | null;

      if (!response.ok) {
        console.error(result?.error || "Napaka pri posodabljanju opravila");
        setOpravila((prev) =>
          prev.map((op) =>
            op.id === id ? { ...op, opravljeno: trenutnoOpravljeno } : op
          )
        );
        return;
      }

      if (result?.opravilo) {
        const apiOpravljeno = parseOpravljeno(result.opravilo.opravljeno);
        setOpravila((prev) =>
          prev.map((op) =>
            op.id === id ? { ...op, opravljeno: apiOpravljeno } : op
          )
        );
      } else {
        await fetchOpravila();
      }
    } catch (err) {
      console.error("Napaka pri posodabljanju opravila:", err);
      setOpravila((prev) =>
        prev.map((op) =>
          op.id === id ? { ...op, opravljeno: trenutnoOpravljeno } : op
        )
      );
    }
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    const jsDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // JS: nedelja=0 ... sobota=6; želimo: ponedeljek=0 ... nedelja=6
    return (jsDay + 6) % 7;
  };

  const monthNames = [
    "Januar", "Februar", "Marec", "April", "Maj", "Junij",
    "Julij", "Avgust", "September", "Oktober", "November", "December",
  ];

  const dayNames = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getWeekStart = (date: Date) => {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(newDate.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const isInCurrentWeek = (date: Date) => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    return date >= weekStart && date <= weekEnd;
  };

  const normalizeKolikokrat = (value: string | null | undefined) => {
    const normalized = (value || "samo_enkrat").trim().toLowerCase();
    if (normalized === "samo_enkrat") return "samo_enkrat";
    if (normalized === "vsak_dan") return "vsak_dan";
    if (normalized === "vsak_teden") return "vsak_teden";
    if (normalized === "vsak_mesec") return "vsak_mesec";
    if (normalized === "vsako_leto") return "vsako_leto";
    return "samo_enkrat";
  };

  // Pretvori datum v UTC-dan, da izračun ni občutljiv na premik ure (DST)
  const toUtcDayMs = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  const doesOpravljoHappenOnDate = (opravilo: Opravilo, checkDate: Date): boolean => {
    const kolikokrat = normalizeKolikokrat(opravilo.kolikokrat);
    const opDate = new Date(opravilo.od);

    const opDayMs = toUtcDayMs(opDate);
    const checkDayMs = toUtcDayMs(checkDate);

    if (checkDayMs < opDayMs) {
      return false;
    }

    switch (kolikokrat) {
      case "samo_enkrat":
        return checkDayMs === opDayMs;

      case "vsak_dan":
        return checkDayMs >= opDayMs;

      case "vsak_teden": {
        if (checkDate.getDay() !== opDate.getDay()) {
          return false;
        }
        const diffDays = Math.floor((checkDayMs - opDayMs) / 86400000);
        return diffDays % 7 === 0;
      }

      case "vsak_mesec":
        return checkDate.getDate() === opDate.getDate();

      case "vsako_leto":
        return (
          checkDate.getMonth() === opDate.getMonth() &&
          checkDate.getDate() === opDate.getDate()
        );

      default:
        return false;
    }
  };

  const filteredOpravila = 
    filterMode === "specifičen_dan" && selectedDate
      ? opravila.filter((op) => doesOpravljoHappenOnDate(op, selectedDate))
      : filterMode === "ta_teden"
        ? opravila.filter((op) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekEnd = getWeekEnd(today);
            // Za "Ta teden" upoštevamo od danes do nedelje.
            for (let d = new Date(today); d <= weekEnd; d.setDate(d.getDate() + 1)) {
              if (doesOpravljoHappenOnDate(op, new Date(d))) {
                return true;
              }
            }
            return false;
          })
        : opravila.filter((op) => {
            // Za sve dneve, provjeri ako se opravilo izvršava u trenutnom mjesecu
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            monthEnd.setHours(23, 59, 59, 999);
            
            for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
              if (doesOpravljoHappenOnDate(op, new Date(d))) {
                return true;
              }
            }
            return false;
          });

  const sortedOpravila = [...filteredOpravila].sort((a, b) => {
    const odDiff = new Date(a.od).getTime() - new Date(b.od).getTime();
    if (odDiff !== 0) {
      return odDiff;
    }

    const doDiff = new Date(a.do).getTime() - new Date(b.do).getTime();
    if (doDiff !== 0) {
      return doDiff;
    }

    return a.id - b.id;
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const daysArray = [];
  const firstDay = firstDayOfMonth(currentDate);
  const days = daysInMonth(currentDate);

  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= days; i++) {
    daysArray.push(i);
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("sl-SI", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sl-SI", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  return (
    <>
      <section className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Koledar */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="rounded-lg border border-[var(--line)] p-2 hover:bg-[var(--accent-soft)] transition-colors"
              >
                ←
              </button>
              <button
                onClick={nextMonth}
                className="rounded-lg border border-[var(--line)] p-2 hover:bg-[var(--accent-soft)] transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Dan v tednu */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-[var(--muted)]">
                {day}
              </div>
            ))}
          </div>

          {/* Dnevi */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="py-2" />;
              }

              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const hasEvents = opravila.some((op) => doesOpravljoHappenOnDate(op, date));

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDate(date);
                    setFilterMode("specifičen_dan");
                  }}
                  className={`relative aspect-square rounded-xl py-2 text-sm font-semibold transition-all ${
                    filterMode === "specifičen_dan" && isSelected(date)
                      ? "bg-[var(--accent)] text-white"
                      : isToday(date)
                        ? "border-2 border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${filterMode === "specifičen_dan" && isSelected(date) ? "bg-white" : "bg-[var(--accent)]"}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setFilterMode("ta_teden")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                filterMode === "ta_teden"
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  : "border border-[var(--line)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Ta teden
            </button>
            <button
              onClick={() => setFilterMode("vsi_dnevi")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                filterMode === "vsi_dnevi"
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  : "border border-[var(--line)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Vsi dnevi
            </button>
          </div>
        </div>

        {/* Preglednica opravil */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)] lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl">
              {filterMode === "specifičen_dan" && selectedDate
                ? `Opravila za ${selectedDate.toLocaleDateString("sl-SI", { month: "long", day: "numeric" })}`
                : filterMode === "ta_teden"
                  ? "Opravila - Ta teden"
                  : `Opravila - ${monthNames[currentDate.getMonth()]}`}
            </h2>
            <Link
              href="/aplikacija/novo"
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
            >
              + Novo
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-[var(--muted)]">Nalagam opravila...</p>
          ) : sortedOpravila.length === 0 ? (
            <p className="text-center text-[var(--muted)]">Ni opravil</p>
          ) : (
            <div className="space-y-3">
              {sortedOpravila.map((opravilo) => (
                <div
                  key={opravilo.id}
                  className={`rounded-xl border p-4 transition-all ${
                    opravilo.opravljeno
                      ? "border-emerald-200 bg-emerald-50/95 shadow-[0_14px_28px_-24px_rgba(16,185,129,0.65)]"
                      : "border-[var(--line)] bg-white/50 hover:border-[var(--accent)] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <label
                      className="group mt-0.5 inline-flex cursor-pointer items-center"
                      title={opravilo.opravljeno ? "Označi kot neopravljeno" : "Označi kot opravljeno"}
                    >
                      <input
                        type="checkbox"
                        checked={opravilo.opravljeno}
                        onChange={(e) =>
                          toggleOpravilo(
                            opravilo.id,
                            opravilo.opravljeno,
                            e.target.checked
                          )
                        }
                        className="peer sr-only"
                        aria-label={opravilo.opravljeno ? "Označi kot neopravljeno" : "Označi kot opravljeno"}
                      />
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--line)] bg-white/90 text-white shadow-[0_8px_18px_-12px_rgba(29,37,51,0.55)] transition-all duration-200 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-soft)] peer-checked:border-green-500 peer-checked:bg-green-500 peer-checked:shadow-[0_10px_22px_-10px_rgba(34,197,94,0.55)]">
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
                      <div className="flex items-center justify-between gap-3">
                        <h3 className={`min-w-0 font-semibold ${opravilo.opravljeno ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                          {opravilo.naslov}
                        </h3>
                        <Link
                          href={`/aplikacija/uredi/${opravilo.id}`}
                          className="inline-flex shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                        >
                          Spremeni
                        </Link>
                      </div>
                      {opravilo.opis && (
                        <p className={`mt-1 text-sm line-clamp-2 ${opravilo.opravljeno ? "text-[var(--muted)]" : "text-[var(--muted)]"}`}>
                          {opravilo.opis}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                        <span>📅 {formatDate(opravilo.od)}</span>
                        <span>⏰ {formatTime(opravilo.od)} - {formatTime(opravilo.do)}</span>
                        <span className="inline-block rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]">
                          {opravilo.kolikokrat === "samo_enkrat" && "Samo enkrat"}
                          {opravilo.kolikokrat === "vsak_dan" && "Vsak dan"}
                          {opravilo.kolikokrat === "vsak_teden" && "Vsak teden"}
                          {opravilo.kolikokrat === "vsak_mesec" && "Vsak mesec"}
                          {opravilo.kolikokrat === "vsako_leto" && "Vsako leto"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
