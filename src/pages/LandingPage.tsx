import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { PageShell } from '@/components/ace/PageShell';
import { AceButton } from '@/components/ace/AceButton';
import { FloatingNavbar } from '@/components/ui/floating-navbar';
import { TextGenerateEffect } from '@/components/ui/text-generate';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { HoverEffect } from '@/components/ui/hover-effect';
import { MovingBorderButton } from '@/components/ui/moving-border';

export function LandingPage() {
  const { isAuthenticated, login, logout, user, devLogin } = useAuth();

  return (
    <PageShell beams spotlight maxWidth="max-w-5xl" className="pb-20">
      <FloatingNavbar
        brand="Cafe Platform"
        navItems={[
          { name: 'Demo', link: '/c/demo-cafe' },
          { name: 'POS', link: '/pos' },
          { name: 'KDS', link: '/kds' },
          { name: 'Member', link: '/member' },
        ]}
        right={
          isAuthenticated ? (
            <>
              <span className="hidden text-xs text-[#6b6b6b] sm:inline">{user?.email}</span>
              <AceButton as={Link} to="/app" variant="primary" className="!py-1.5 !text-xs">
                Dashboard
              </AceButton>
              <AceButton variant="ghost" className="!py-1.5 !text-xs" onClick={logout}>
                Logout
              </AceButton>
            </>
          ) : (
            <>
              <AceButton variant="primary" className="!py-1.5 !text-xs" onClick={login}>
                Login
              </AceButton>
              <AceButton variant="ghost" className="!py-1.5 !text-xs" onClick={() => devLogin('owner')}>
                Dev
              </AceButton>
            </>
          )
        }
      />

      <main className="pt-24">
        <h1 className="sr-only">Cafe Platform</h1>
        <TextGenerateEffect
          words="Homepage, QR order, POS & dapur — satu platform."
          className="max-w-2xl text-4xl md:text-5xl"
        />
        <p className="mt-4 max-w-xl text-lg text-[#6b6b6b]">
          Multi-tenant SaaS untuk kafe Indonesia. Pesan via QR, bayar Midtrans, real-time ke kasir & kitchen.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <MovingBorderButton onClick={login}>Mulai gratis</MovingBorderButton>
          <AceButton as={Link} to="/pos" variant="ghost">
            Buka POS
          </AceButton>
          <AceButton as={Link} to="/kds" variant="ghost">
            Buka KDS
          </AceButton>
          <AceButton as={Link} to="/platform" variant="ghost">
            Platform Admin
          </AceButton>
          <AceButton as={Link} to="/c/demo-cafe" variant="accent">
            Demo cafe
          </AceButton>
        </div>

        <BentoGrid className="mt-16">
          <BentoGridItem
            title="QR Ordering"
            description="Scan meja → menu → bayar → dapur"
            className="md:col-span-1"
          />
          <BentoGridItem
            title="POS + KDS"
            description="Real-time order & station tickets"
            className="md:col-span-1"
          />
          <BentoGridItem
            title="Ledger & Payout"
            description="Midtrans terpusat + rekonsiliasi"
            className="md:col-span-1"
          />
        </BentoGrid>

        <h2 className="mt-16 text-xl font-bold">Jelajahi</h2>
        <HoverEffect
          className="mt-4"
          items={[
            { title: 'Merchant app', description: 'Menu, meja, laporan, staf', link: '/app' },
            { title: 'Waiter', description: 'Antar pesanan siap', link: '/waiter' },
            { title: 'Reservasi demo', description: 'Booking meja publik', link: '/c/demo-cafe/reservation' },
          ]}
        />
      </main>
    </PageShell>
  );
}
