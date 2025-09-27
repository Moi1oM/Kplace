import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

// 미들웨어: 인증 확인
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // userId가 확실히 있음을 타입에 반영
    },
  });
});

// 미들웨어: 쿨다운 체크
const checkCooldown = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다.',
    });
  }

  const user = await ctx.prisma.user.findUnique({
    where: { clerkId: ctx.userId },
  });

  const MAX_PIXELS_PER_WINDOW = 5;
  const WINDOW_DURATION_MS = 60 * 1000;

  if (user?.pixelWindowStartTime) {
    const elapsed = Date.now() - user.pixelWindowStartTime.getTime();

    if (elapsed > WINDOW_DURATION_MS) {
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          pixelWindowStartTime: null,
          pixelCount: 0,
        },
      });
      return next({ ctx });
    }
  }

  if (user && user.pixelCount >= MAX_PIXELS_PER_WINDOW) {
    const remainingMs = WINDOW_DURATION_MS -
      (Date.now() - user.pixelWindowStartTime!.getTime());
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `1분에 ${MAX_PIXELS_PER_WINDOW}개 제한입니다. ${remainingSeconds}초 후 리셋됩니다.`,
      cause: {
        cooldown: true,
        remainingSeconds,
        remainingPixels: 0,
      },
    });
  }

  return next({ ctx });
});

// 로깅 미들웨어 (개발 환경용)
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[tRPC] ${type} ${path} - ${durationMs}ms - ${result.ok ? 'OK' : 'ERROR'}`);
  }

  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure.use(loggerMiddleware).use(isAuthed);
export const rateLimitedProcedure = protectedProcedure.use(checkCooldown);