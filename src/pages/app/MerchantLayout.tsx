import { Link, Outlet } from 'react-router-dom';
import {
  House,
  ChartBar,
  ForkKnife,
  GridFour,
  CalendarBlank,
  Tag,
  Users,
  ChatCircle,
  Wallet,
  Coins,
  ArrowUUpLeft,
  RocketLaunch,
  Browser,
  Printer,
  UserGear,
  CashRegister,
  CookingPot,
  HandWaving,
} from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth';
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { AceSidebar, type SidebarGroup } from '@/components/ui/sidebar';
import { AceButton } from '@/components/ace/AceButton';
import { BrandFooter } from '@/components/ace/BrandFooter';

const icon = { weight: 'duotone' as const, className: 'h-[18px] w-[18px]' };

const navGroups: SidebarGroup[] = [
  {
    label: 'Utama',
    links: [
      { label: 'Dashboard', href: '/app', end: true, icon: <House {...icon} /> },
      { label: 'Laporan', href: '/app/reports', icon: <ChartBar {...icon} /> },
    ],
  },
  {
    label: 'Operasi',
    links: [
      { label: 'Menu', href: '/app/menu', icon: <ForkKnife {...icon} /> },
      { label: 'Meja & QR', href: '/app/tables', icon: <GridFour {...icon} /> },
      { label: 'Reservasi', href: '/app/reservations', icon: <CalendarBlank {...icon} /> },
      { label: 'Promo', href: '/app/promo', icon: <Tag {...icon} /> },
      { label: 'Pelanggan', href: '/app/customers', icon: <Users {...icon} /> },
      { label: 'Feedback', href: '/app/feedback', icon: <ChatCircle {...icon} /> },
    ],
  },
  {
    label: 'Keuangan',
    links: [
      { label: 'Ledger', href: '/app/ledger', icon: <Wallet {...icon} /> },
      { label: 'Tip', href: '/app/tips', icon: <Coins {...icon} /> },
      { label: 'Refund', href: '/app/refunds', icon: <ArrowUUpLeft {...icon} /> },
    ],
  },
  {
    label: 'Setup',
    links: [
      { label: 'Onboarding', href: '/app/onboarding', icon: <RocketLaunch {...icon} /> },
      { label: 'Homepage', href: '/app/homepage', icon: <Browser {...icon} /> },
      { label: 'Printer', href: '/app/printers', icon: <Printer {...icon} /> },
      { label: 'Staf', href: '/app/staff', icon: <UserGear {...icon} /> },
    ],
  },
  {
    label: 'Floor',
    links: [
      { label: 'POS', href: '/pos', icon: <CashRegister {...icon} /> },
      { label: 'KDS', href: '/kds', icon: <CookingPot {...icon} /> },
      { label: 'Waiter', href: '/waiter', icon: <HandWaving {...icon} /> },
    ],
  },
];

export function MerchantLayout() {
  const { user, logout } = useAuth();

  return (
    <div data-theme-lock="light" className="flex min-h-[100dvh] flex-col bg-cafe-bg md:flex-row">
      <AceSidebar
        brand="Tempat Kafe"
        groups={navGroups}
        footer={
          <div className="space-y-2">
            <p className="truncate text-xs text-cafe-muted" title={user?.email}>
              {user?.email}
            </p>
            <AceButton variant="ghost" className="!w-full !py-1.5 !text-xs" onClick={logout}>
              Logout
            </AceButton>
            <Link
              to="/"
              className="block text-center text-xs font-medium text-cafe-muted underline-offset-2 hover:text-cafe-ink hover:underline"
            >
              Beranda
            </Link>
          </div>
        }
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-cafe-border bg-cafe-card/90 px-4 py-3 backdrop-blur md:px-8">
          <TenantSwitcher />
          <div className="flex flex-wrap items-center gap-2">
            <AceButton as={Link} to="/pos" variant="primary" className="!py-1.5 !text-xs">
              Buka POS
            </AceButton>
            <AceButton as={Link} to="/kds" variant="ghost" className="!py-1.5 !text-xs">
              KDS
            </AceButton>
          </div>
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
        <BrandFooter />
      </div>
    </div>
  );
}
