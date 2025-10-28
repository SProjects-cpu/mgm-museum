'use client';

import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo/client';

interface ApolloProviderProps {
  children: React.ReactNode;
}

export function ApolloProviderWrapper({ children }: ApolloProviderProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}

