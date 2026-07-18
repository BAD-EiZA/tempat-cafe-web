import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader } from '@/components/ui/loader';
import { PageShell } from '@/components/ace/PageShell';

export function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <PageShell variant="plain" beams={false} maxWidth="max-w-md">
        <Loader label="Loading…" className="pt-20" />
      </PageShell>
    );
  }
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
