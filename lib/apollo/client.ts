'use client';

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// HTTP Link
const httpLink = createHttpLink({
  uri: '/api/graphql',
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Exhibition: {
        keyFields: ['id'],
      },
      Show: {
        keyFields: ['id'],
      },
      Booking: {
        keyFields: ['id'],
      },
      Event: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

