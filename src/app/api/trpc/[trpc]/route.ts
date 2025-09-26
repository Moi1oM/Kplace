import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc/context';
import { NextRequest } from 'next/server';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError({ error, type, path, input, ctx, req }) {
      console.error(`tRPC Error on ${path}:`, error);

      // 에러 모니터링 서비스에 전송 (예: Sentry)
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        // 프로덕션 환경에서 심각한 에러 로깅
        console.error('Critical error:', {
          type,
          path,
          input,
          error: error.message,
          stack: error.stack,
        });
      }
    },
  });

export { handler as GET, handler as POST };