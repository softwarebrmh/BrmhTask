'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { PageSpinner } from '@/components/ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Redirect decisions read the store directly via getState() instead of the
  // hook value: during React hydration the hook can briefly return the stale
  // server snapshot (unauthenticated) even though the persisted client store
  // is already authenticated, which caused hard reloads to bounce to /login.
  useEffect(() => {
    if (!mounted) return;

    const redirectIfLoggedOut = () => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace('/login');
      }
    };

    if (useAuthStore.persist.hasHydrated()) {
      redirectIfLoggedOut();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(redirectIfLoggedOut);
      return unsub;
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
