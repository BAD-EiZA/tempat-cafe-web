import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { PublicCafePage } from './pages/public/PublicCafePage';
import { PublicMenuPage } from './pages/public/PublicMenuPage';
import { QrEntryPage } from './pages/public/QrEntryPage';
import { CheckoutPage } from './pages/public/CheckoutPage';
import { OrderTrackPage } from './pages/public/OrderTrackPage';
import { ReservationPage } from './pages/public/ReservationPage';
import { MerchantLayout } from './pages/app/MerchantLayout';
import { DashboardPage } from './pages/app/DashboardPage';
import { OnboardingPage } from './pages/app/OnboardingPage';
import { MenuManagePage } from './pages/app/MenuManagePage';
import { TablesManagePage } from './pages/app/TablesManagePage';
import { HomepageBuilderPage } from './pages/app/HomepageBuilderPage';
import { ReportsPage } from './pages/app/ReportsPage';
import { CustomersPage } from './pages/app/CustomersPage';
import { PromoPage } from './pages/app/PromoPage';
import { LedgerPage } from './pages/app/LedgerPage';
import { PrintersPage } from './pages/app/PrintersPage';
import { ReservationsManagePage } from './pages/app/ReservationsManagePage';
import { FeedbackPage } from './pages/app/FeedbackPage';
import { StaffPage } from './pages/app/StaffPage';
import { TipsPage } from './pages/app/TipsPage';
import { RefundsPage } from './pages/app/RefundsPage';
import { PosPage } from './pages/pos/PosPage';
import { KdsPage } from './pages/kds/KdsPage';
import { WaiterPage } from './pages/waiter/WaiterPage';
import { PlatformPage } from './pages/platform/PlatformPage';
import { MemberPage } from './pages/member/MemberPage';
import { Protected } from './components/Protected';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/c/:cafeSlug" element={<PublicCafePage />} />
      <Route path="/c/:cafeSlug/menu" element={<PublicMenuPage />} />
      <Route path="/c/:cafeSlug/reservation" element={<ReservationPage />} />
      <Route path="/c/:cafeSlug/:branchSlug" element={<PublicCafePage />} />
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
      <Route
        path="/platform/*"
        element={
          <Protected>
            <PlatformPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
