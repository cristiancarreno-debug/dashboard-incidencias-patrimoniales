import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const FIVE_MINUTES = 300_000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      retry: 2,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Componente que envuelve la aplicación con los providers necesarios.
 * Incluye QueryClientProvider de React Query con configuración por defecto.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
