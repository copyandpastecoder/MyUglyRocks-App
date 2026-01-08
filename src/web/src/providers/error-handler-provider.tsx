'use client';

import { useEffect } from 'react';
import { initializeErrorHandlers } from '@/lib/error-logger';

/**
 * Provider to initialize global error handlers on the client side
 */
export function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize window error handlers and unhandled rejection handlers
    initializeErrorHandlers();

    // No cleanup needed as we want handlers to persist throughout the app lifecycle
  }, []);

  return <>{children}</>;
}
