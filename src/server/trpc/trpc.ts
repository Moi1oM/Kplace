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

  if (user?.lastPixelTime) {
    const cooldownMinutes = parseInt(process.env.PIXEL_COOLDOWN_MINUTES || '1');
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastPixel = Date.now() - user.lastPixelTime.getTime();

    if (timeSinceLastPixel < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastPixel) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `쿨다운 중입니다. ${remainingSeconds}초 후 다시 시도해주세요.`,
        cause: {
          cooldown: true,
          remainingSeconds,
        },
      });
    }
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