'use client';
import { useAuth } from '@/context/auth-provider';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/common/full-page-loader';
import { PendingApproval } from '@/components/common/pending-approval';
import { Header } from '@/components/layout/header';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <FullPageLoader />;
  }

  if (user.role === 'pending') {
    return <PendingApproval />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
