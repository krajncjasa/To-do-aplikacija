import Link from "next/link";
import Image from "next/image";

const featureCards = [
  {
    title: "Pametno razvrscanje",
    description:
      "Naloge razporedi po prioriteti, rokih in projektih, da takoj ves, kaj je naslednje.",
  },
  {
    title: "Hiter pregled dneva",
    description:
      "Jasen dashboard pokaze napredek, odprte naloge in cilje, ki jih zelis zakljuciti danes.",
  },
  {
    title: "Ritem brez kaosa",
    description:
      "Opomniki in enostavni seznami te drzijo v fokusu, brez nepotrebnega preklapljanja med aplikacijami.",
  },
];

const quickFacts = ["3 kliki do nove naloge", "Tedenski pregled", "Sinhronizacija med napravami"];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,199,180,0.75),transparent_45%),radial-gradient(circle_at_85%_8%,rgba(185,233,220,0.7),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(247,244,237,0.98))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(52,59,74,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(52,59,74,0.06)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-14 sm:px-10 lg:px-16">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="hero-reveal mb-6 flex w-fit">
              <Image
                src="/slike/logo.png"
                alt="To-do list logo"
                width={120}
                height={120}
                priority
              />
            </div>
            <p className="hero-reveal inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              To-do list aplikacija
            </p>
            <h1 className="hero-reveal-2 font-display mt-6 max-w-2xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Naredi vec v manj casa. Organiziraj vse naloge na enem mestu.
            </h1>
            <p className="hero-reveal-3 mt-6 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              To-do list je enostavna in moderna aplikacija za upravljanje dnevnih,
              tedenskih in dolgocnih ciljev. Pomaga ti ostati osredotocen,
              zakljuciti prioritete in imeti jasen pregled nad napredkom.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {quickFacts.map((fact, index) => (
                <div
                  key={fact}
                  className="feature-reveal opacity-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                  style={{ animationDelay: `${420 + index * 120}ms` }}
                >
                  {fact}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-4">
            <div className="hero-reveal-3 flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/prijava"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-8 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
              >
                Prijava
              </Link>
              <Link
                href="/registracija"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-8 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]"
              >
                Registracija
              </Link>
            </div>

            <div className="hero-reveal-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_28px_70px_-38px_rgba(29,37,51,0.45)] sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-xl">Danesnji fokus</p>
                <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  72% zakljuceno
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-semibold">Pripravi sprint plan</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rok: danes ob 15:00</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-semibold">Preglej prioritete ekipe</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rok: jutri ob 09:00</p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-semibold">Zakljuci tedenski report</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Rok: petek</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {featureCards.map((item, index) => (
            <article
              key={item.title}
              className="feature-reveal opacity-0 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_20px_45px_-34px_rgba(29,37,51,0.45)]"
              style={{ animationDelay: `${680 + index * 140}ms` }}
            >
              <h2 className="font-display text-xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
