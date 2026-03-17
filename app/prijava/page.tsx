"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Prijava() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      setError("Vnesi veljaven e-postni naslov.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Geslo mora imeti vsaj 8 znakov.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: formData.password,
        }),
      });

      const payload: { error?: string; redirectTo?: string } = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Prijava ni uspela.");
        return;
      }

      router.push(payload.redirectTo ?? "/aplikacija");
      router.refresh();
    } catch {
      setError("Napaka povezave s streznikom. Poskusi znova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Ozadje – enako kot landing page */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,199,180,0.75),transparent_45%),radial-gradient(circle_at_85%_8%,rgba(185,233,220,0.7),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(247,244,237,0.98))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(52,59,74,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(52,59,74,0.06)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-14 sm:px-10 lg:px-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">

          {/* Leva stran – opis */}
          <div>
            <div className="hero-reveal mb-6 flex w-fit">
              <Image
                src="/slike/logo.png"
                alt="To-do list logo"
                width={100}
                height={100}
              />
            </div>
            <Link
              href="/"
              className="hero-reveal-2 inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:border-[var(--accent)]"
            >
              ← Nazaj na domačo stran
            </Link>
            <h1 className="hero-reveal-2 font-display mt-6 text-4xl leading-tight sm:text-5xl">
              Prijavite se v vaš račun.
            </h1>
            <p className="hero-reveal-3 mt-5 max-w-sm text-base leading-8 text-[var(--muted)]">
              Uspešno se prijavite in nemudoma dostopite do svojih nalog,
              opomnikov ter celovitega pregleda vašega To-do lista.
            </p>

            <div className="hero-reveal-4 mt-8 space-y-3">
              {[
                "Varni dostop",
                "Tajni podatki",
                "Nemudoma dostopna",
              ].map((fact) => (
                <div
                  key={fact}
                  className="flex items-center gap-3 text-sm text-[var(--muted)]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[var(--accent)] text-xs font-bold">
                    ✓
                  </span>
                  {fact}
                </div>
              ))}
            </div>
          </div>

          {/* Desna stran – forma */}
          <div className="hero-reveal-3 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[0_28px_70px_-38px_rgba(29,37,51,0.45)]">
            <p className="font-display text-2xl">Prijava</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Še nimate računa?{" "}
              <Link
                href="/registracija"
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Registracija
              </Link>
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                  aria-live="polite"
                >
                  <p className="font-semibold">Pozor</p>
                  <p>{error}</p>
                </div>
              )}

              {/* E-pošta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  E-poštni naslov
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, email: event.target.value }));
                    setError("");
                  }}
                  placeholder="ana@primer.si"
                  autoComplete="email"
                  className="h-11 rounded-xl border border-[var(--line)] bg-white/70 px-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {/* Geslo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Geslo
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(event) => {
                      setFormData((prev) => ({ ...prev, password: event.target.value }));
                      setError("");
                    }}
                    placeholder="Vnesite geslo"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 pr-12 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    {showPassword ? "Skrij" : "Pokaži"}
                  </button>
                </div>
              </div>

              {/* Gumb */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
              >
                {isSubmitting ? "Prijavljam..." : "Prijavite se"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}