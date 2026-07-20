import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  QrCode,
  CashRegister,
  CookingPot,
  CreditCard,
  Storefront,
  ArrowRight,
  DeviceMobile,
  UsersThree,
} from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth';
import { PageShell } from '@/components/ace/PageShell';
import { AceButton } from '@/components/ace/AceButton';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { MovingBorderButton } from '@/components/ui/moving-border';
import { assets } from '@/lib/assets';

const ease = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  const { isAuthenticated, login, logout, user, devLogin } = useAuth();
  const reduce = useReducedMotion();

  return (
    <PageShell beams spotlight maxWidth="max-w-6xl" className="pb-0">
      <FloatingNavbar
        brand="Tempat Kafe"
        navItems={[
          { name: 'Fitur', link: '#fitur' },
          { name: 'Alur', link: '#alur' },
          { name: 'Demo', link: '/c/demo-cafe' },
        ]}
        right={
          isAuthenticated ? (
            <>
              <span className="hidden text-xs text-cafe-muted sm:inline">{user?.email}</span>
              <AceButton as={Link} to="/app" variant="primary" className="!py-1.5 !text-xs">
                Dashboard
              </AceButton>
              <AceButton variant="ghost" className="!py-1.5 !text-xs" onClick={logout}>
                Logout
              </AceButton>
            </>
          ) : (
            <>
              <AceButton variant="ghost" className="!py-1.5 !text-xs" onClick={login}>
                Login
              </AceButton>
              <AceButton variant="primary" className="!py-1.5 !text-xs" onClick={login}>
                Mulai gratis
              </AceButton>
            </>
          )
        }
      />

      <main>
        {/* Hero: asymmetric split */}
        <section className="grid min-h-[100dvh] items-center gap-10 pt-20 pb-16 md:grid-cols-2 md:gap-12 md:pt-24 md:pb-20">
          <div>
            <motion.h1
              className="max-w-xl text-4xl font-bold tracking-tight text-cafe-ink md:text-5xl lg:text-6xl leading-[1.1]"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              QR, kasir & dapur dalam satu platform
            </motion.h1>
            <motion.p
              className="mt-4 max-w-[36ch] text-base leading-relaxed text-cafe-muted md:text-lg"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease }}
            >
              Multi-tenant untuk kafe Indonesia. Scan meja, bayar Midtrans, real-time ke POS & KDS.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14, ease }}
            >
              {isAuthenticated ? (
                <AceButton as={Link} to="/app" variant="primary">
                  Buka dashboard
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </AceButton>
              ) : (
                <MovingBorderButton onClick={login}>
                  Mulai gratis
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </MovingBorderButton>
              )}
              <AceButton as={Link} to="/c/demo-cafe" variant="ghost">
                Lihat demo
              </AceButton>
            </motion.div>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => devLogin('owner')}
                className="mt-4 text-xs text-cafe-muted underline-offset-2 hover:underline"
              >
                Dev login (owner)
              </button>
            )}
          </div>

          <motion.div
            className="relative"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-cafe-border shadow-xl sm:aspect-[5/4] md:aspect-[4/5] lg:aspect-[5/4]">
              <img
                src={assets.heroInterior}
                alt="Interior kafe modern dengan pencahayaan hangat"
                className="h-full w-full object-cover"
                width={960}
                height={1200}
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cafe-forest/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-cafe-card sm:p-6">
                <p className="text-sm font-semibold">Pesan dari meja</p>
                <p className="mt-1 max-w-[28ch] text-xs text-cafe-card/85">
                  Tamu scan QR, pilih menu, bayar. Ticket masuk dapur tanpa antri kasir.
                </p>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-2 hidden rounded-2xl border border-cafe-border bg-cafe-card p-3 shadow-lg sm:block md:-left-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-forest text-cafe-card">
                  <QrCode weight="duotone" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-cafe-ink">QR meja aktif</p>
                  <p className="text-[11px] text-cafe-muted">Order masuk real-time</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How it works */}
        <section id="alur" className="border-t border-cafe-border py-16 md:py-24">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-cafe-ink md:text-3xl">
              Dari scan sampai saji
            </h2>
            <p className="mt-2 max-w-[50ch] text-cafe-muted">
              Tiga langkah. Tanpa antrean, tanpa kertas order.
            </p>
          </Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'Scan & pilih',
                body: 'Tamu buka menu digital dari QR meja, atur porsi dan catatan.',
                icon: DeviceMobile,
              },
              {
                n: '02',
                title: 'Bayar Midtrans',
                body: 'Checkout aman. Ledger terpusat, rekonsiliasi per cabang.',
                icon: CreditCard,
              },
              {
                n: '03',
                title: 'POS & KDS',
                body: 'Kasir & stasiun dapur terima ticket langsung, status ke waiter.',
                icon: CookingPot,
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 0.06}>
                <li className="relative flex h-full flex-col rounded-2xl border border-cafe-border bg-cafe-card p-6">
                  <span className="font-mono text-xs font-semibold text-cafe-accent">{step.n}</span>
                  <step.icon weight="duotone" className="mt-4 h-8 w-8 text-cafe-forest" />
                  <h3 className="mt-3 text-lg font-semibold text-cafe-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cafe-muted">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Features bento */}
        <section id="fitur" className="border-t border-cafe-border py-16 md:py-24">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-cafe-ink md:text-3xl">
              Semua yang dibutuhkan kafe
            </h2>
          </Reveal>
          <BentoGrid className="mt-10 md:auto-rows-[minmax(160px,auto)]">
            <div className="group/bento relative min-h-[180px] overflow-hidden rounded-2xl border border-cafe-border shadow-sm md:col-span-2 md:min-h-[200px]">
              <img
                src={assets.qrOrder}
                alt="Tamu memesan lewat ponsel di meja kafe"
                className="absolute inset-0 h-full w-full object-cover"
                width={900}
                height={500}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cafe-forest/85 via-cafe-forest/40 to-transparent" />
              <div className="relative z-10 flex h-full min-h-[180px] flex-col justify-end p-5 text-cafe-card md:min-h-[200px]">
                <QrCode weight="duotone" className="h-7 w-7" />
                <p className="mt-2 text-lg font-semibold">QR ordering</p>
                <p className="mt-1 max-w-[40ch] text-sm text-cafe-card/85">
                  Scan meja, menu, bayar, dapur. Satu alur tanpa ganti app.
                </p>
              </div>
            </div>
            <BentoGridItem
              className="bg-cafe-forest text-cafe-card border-cafe-forest md:col-span-1"
              icon={<CashRegister weight="duotone" className="h-7 w-7 text-cafe-accent" />}
              title={<span className="text-cafe-card">POS + KDS</span>}
              description={
                <span className="text-cafe-card/75">Order real-time & ticket per stasiun.</span>
              }
            />
            <BentoGridItem
              icon={<CreditCard weight="duotone" className="h-7 w-7 text-cafe-accent" />}
              title="Ledger & payout"
              description="Midtrans terpusat plus rekonsiliasi cabang."
            />
            <BentoGridItem
              className="md:col-span-2"
              icon={<Storefront weight="duotone" className="h-7 w-7 text-cafe-forest" />}
              title="Multi-tenant & multi-cabang"
              description="Satu platform, banyak merek. Switch org & branch tanpa logout."
              header={
                <div className="h-24 overflow-hidden rounded-xl bg-cafe-hover">
                  <img
                    src={assets.branches}
                    alt="Deretan cabang kafe"
                    className="h-full w-full object-cover opacity-90"
                    width={800}
                    height={200}
                    loading="lazy"
                  />
                </div>
              }
            />
          </BentoGrid>
        </section>

        {/* Guest vs staff */}
        <section className="border-t border-cafe-border py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-cafe-border shadow-md">
                <img
                  src={assets.staffBar}
                  alt="Barista dan staf melayani pesanan"
                  className="aspect-[5/4] w-full object-cover"
                  width={800}
                  height={640}
                  loading="lazy"
                />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="text-2xl font-bold tracking-tight text-cafe-ink md:text-3xl">
                Tamu pesan. Tim jalankan.
              </h2>
              <p className="mt-3 max-w-[48ch] text-cafe-muted leading-relaxed">
                Guest app untuk menu & lacak order. Merchant app untuk menu, meja, staf, promo.
                POS, KDS, dan waiter sinkron di shift yang sama.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-cafe-ink">
                {[
                  { icon: UsersThree, t: 'Member & loyalty di satu profil' },
                  { icon: CashRegister, t: 'Shift, merge meja, tip & refund' },
                  { icon: CookingPot, t: 'Status siap antar ke waiter' },
                ].map((row) => (
                  <li key={row.t} className="flex items-center gap-3">
                    <row.icon weight="duotone" className="h-5 w-5 shrink-0 text-cafe-forest-mid" />
                    {row.t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <AceButton as={Link} to="/pos" variant="ghost">
                  Buka POS
                </AceButton>
                <AceButton as={Link} to="/kds" variant="ghost">
                  Buka KDS
                </AceButton>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-cafe-border py-16 md:py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-cafe-forest px-6 py-12 text-center text-cafe-card md:px-12 md:py-16">
              <div className="pointer-events-none absolute inset-0 bg-dot-grid-dark opacity-40" />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Siap jalankan kafe tanpa kertas?
                </h2>
                <p className="mx-auto mt-3 max-w-[40ch] text-sm text-cafe-card/80 md:text-base">
                  Daftar, setup cabang, cetak QR meja. Demo live tersedia sekarang.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <AceButton
                    variant="accent"
                    onClick={isAuthenticated ? undefined : login}
                    as={isAuthenticated ? Link : undefined}
                    to={isAuthenticated ? '/app' : undefined}
                  >
                    {isAuthenticated ? 'Ke dashboard' : 'Mulai gratis'}
                  </AceButton>
                  <AceButton
                    as={Link}
                    to="/c/demo-cafe"
                    variant="ghost"
                    className="!border-cafe-card/30 !text-cafe-card hover:!bg-white/10"
                  >
                    Demo cafe
                  </AceButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </PageShell>
  );
}
