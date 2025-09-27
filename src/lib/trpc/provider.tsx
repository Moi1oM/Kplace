'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink, TRPCClientError } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers/_app';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1분
          retry: (failureCount, error: unknown) => {
            // TRPCClientError 타입 체크
            if (error instanceof TRPCClientError<AppRouter>) {
              // 인증 에러는 재시도하지 않음
              if (error.data?.code === 'UNAUTHORIZED') return false;
              // 쿨다운 에러는 재시도하지 않음
              if (error.data?.code === 'TOO_MANY_REQUESTS') return false;
              // 유효성 검사 에러는 재시도하지 않음
              if (error.data?.code === 'BAD_REQUEST') return false;
            }
            // 그 외 에러는 3번까지 재시도
            return failureCount < 3;
          },
        },
        mutations: {
          retry: false, // mutation은 기본적으로 재시도하지 않음
        },
      },
    })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: () => process.env.NODE_ENV === 'development',
          logger(opts) {
            const { direction, path } = opts;
            if (direction === 'down') {
              if (opts.result instanceof Error) {
                console.error(`[tRPC] ${path} failed:`, opts.result.message);
              } else {
                console.log(`[tRPC] ${path} success:`, opts.result);
              }
            } else if (direction === 'up') {
              console.log(`[tRPC] ${path} called with:`, opts.input);
            }
          },
        }),
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          // 헤더 설정 (필요시)
          headers() {
            return {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}