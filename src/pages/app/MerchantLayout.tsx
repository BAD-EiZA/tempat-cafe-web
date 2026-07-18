import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { AceSidebar } from '@/components/ui/sidebar';
import { AceButton } from '@/components/ace/AceButton';

const links = [
  { label: 'Dashboard', href: '/app', end: true },
  { label: 'Onboarding', href: '/app/onboarding' },
  { label: 'Menu', href: '/app/menu' },
  { label: 'Meja & QR', href: '/app/tables' },
  { label: 'Homepage', href: '/app/homepage' },
  { label: 'Promo', href: '/app/promo' },
  { label: 'Pelanggan', href: '/app/customers' },
  { label: 'Reservasi', href: '/app/reservations' },
  { label: 'Feedback', href: '/app/feedback' },
  { label: 'Tip', href: '/app/tips' },
  { label: 'Refund', href: '/app/refunds' },
  { label: 'Printer', href: '/app/printers' },
  { label: 'Ledger', href: '/app/ledger' },
  { label: 'Staf', href: '/app/staff' },
  { label: 'Laporan', href: '/app/reports' },
  { label: 'POS', href: '/pos' },
  { label: 'KDS', href: '/kds' },
  { label: 'Waiter', href: '/waiter' },
];

export function MerchantLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="relative flex min-h-screen bg-[#faf8f5]">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />
      <AceSidebar
        brand="Cafe Merchant"
        links={links}
        footer={
          <div className="space-y-2 text-xs text-[#6b6b6b]">
            <p className="truncate">{user?.email}</p>
            <AceButton variant="ghost" className="!w-full !py-1.5 !text-xs" onClick={logout}>
              Logout
            </AceButton>
            <Link to="/" className="block underline">
              Beranda
            </Link>
          </div>
        }
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="border-b border-[#e8e4de] bg-white/70 px-4 py-3 backdrop-blur md:px-8">
          <TenantSwitcher />
        </div>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
