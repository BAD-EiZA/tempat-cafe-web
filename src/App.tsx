import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Protected } from './components/Protected';

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const PublicCafePage = lazy(() => import('./pages/public/PublicCafePage').then((module) => ({ default: module.PublicCafePage })));
const PublicMenuPage = lazy(() => import('./pages/public/PublicMenuPage').then((module) => ({ default: module.PublicMenuPage })));
const QrEntryPage = lazy(() => import('./pages/public/QrEntryPage').then((module) => ({ default: module.QrEntryPage })));
const CheckoutPage = lazy(() => import('./pages/public/CheckoutPage').then((module) => ({ default: module.CheckoutPage })));
const OrderTrackPage = lazy(() => import('./pages/public/OrderTrackPage').then((module) => ({ default: module.OrderTrackPage })));
const ReservationPage = lazy(() => import('./pages/public/ReservationPage').then((module) => ({ default: module.ReservationPage })));
const MerchantLayout = lazy(() => import('./pages/app/MerchantLayout').then((module) => ({ default: module.MerchantLayout })));
const DashboardPage = lazy(() => import('./pages/app/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const OnboardingPage = lazy(() => import('./pages/app/OnboardingPage').then((module) => ({ default: module.OnboardingPage })));
const MenuManagePage = lazy(() => import('./pages/app/MenuManagePage').then((module) => ({ default: module.MenuManagePage })));
const TablesManagePage = lazy(() => import('./pages/app/TablesManagePage').then((module) => ({ default: module.TablesManagePage })));
const HomepageBuilderPage = lazy(() => import('./pages/app/HomepageBuilderPage').then((module) => ({ default: module.HomepageBuilderPage })));
const ReportsPage = lazy(() => import('./pages/app/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const CustomersPage = lazy(() => import('./pages/app/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const PromoPage = lazy(() => import('./pages/app/PromoPage').then((module) => ({ default: module.PromoPage })));
const LedgerPage = lazy(() => import('./pages/app/LedgerPage').then((module) => ({ default: module.LedgerPage })));
const PrintersPage = lazy(() => import('./pages/app/PrintersPage').then((module) => ({ default: module.PrintersPage })));
const ReservationsManagePage = lazy(() => import('./pages/app/ReservationsManagePage').then((module) => ({ default: module.ReservationsManagePage })));
const FeedbackPage = lazy(() => import('./pages/app/FeedbackPage').then((module) => ({ default: module.FeedbackPage })));
const StaffPage = lazy(() => import('./pages/app/StaffPage').then((module) => ({ default: module.StaffPage })));
const TipsPage = lazy(() => import('./pages/app/TipsPage').then((module) => ({ default: module.TipsPage })));
const RefundsPage = lazy(() => import('./pages/app/RefundsPage').then((module) => ({ default: module.RefundsPage })));
const PosPage = lazy(() => import('./pages/pos/PosPage').then((module) => ({ default: module.PosPage })));
const KdsPage = lazy(() => import('./pages/kds/KdsPage').then((module) => ({ default: module.KdsPage })));
const WaiterPage = lazy(() => import('./pages/waiter/WaiterPage').then((module) => ({ default: module.WaiterPage })));
const PlatformPage = lazy(() => import('./pages/platform/PlatformPage').then((module) => ({ default: module.PlatformPage })));
const MemberPage = lazy(() => import('./pages/member/MemberPage').then((module) => ({ default: module.MemberPage })));

export function App() {
  return (
    <Suspense fallback={<div role="status" aria-live="polite">Loading page...</div>}>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/c/:cafeSlug" element={<PublicCafePage />} />
      <Route path="/c/:cafeSlug/menu" element={<PublicMenuPage />} />
      <Route path="/c/:cafeSlug/reservation" element={<ReservationPage />} />
      <Route path="/c/:cafeSlug/:branchSlug" element={<PublicCafePage />} />
      <Route path="/c/:cafeSlug/:branchSlug/menu" element={<PublicMenuPage />} />
      <Route path="/c/:cafeSlug/:branchSlug/reservation" element={<ReservationPage />} />
      <Route path="/qr/:token" element={<QrEntryPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/:publicToken" element={<OrderTrackPage />} />
      <Route path="/member/*" element={<MemberPage />} />

      <Route
        path="/app"
        element={
          <Protected>
            <MerchantLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="menu" element={<MenuManagePage />} />
        <Route path="tables" element={<TablesManagePage />} />
        <Route path="homepage" element={<HomepageBuilderPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="promo" element={<PromoPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="printers" element={<PrintersPage />} />
        <Route path="reservations" element={<ReservationsManagePage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="tips" element={<TipsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="staff" element={<StaffPage />} />
      </Route>

      <Route
        path="/pos/*"
        element={
          <Protected>
            <PosPage />
          </Protected>
        }
      />
      <Route
        path="/kds/*"
        element={
          <Protected>
            <KdsPage />
          </Protected>
        }
      />
      <Route
        path="/waiter/*"
        element={
          <Protected>
            <WaiterPage />
          </Protected>
        }
      />
      {/* Platform handles its own auth UI; Protected would hide login gate */}
      <Route path="/platform/*" element={<PlatformPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
