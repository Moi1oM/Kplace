import { router, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  getCooldownStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { clerkId: ctx.userId },
          select: {
            id: true,
            username: true,
            lastPixelTime: true,
            createdAt: true,
          },
        });

        const cooldownMinutes = parseInt(process.env.PIXEL_COOLDOWN_MINUTES || '1');
        const cooldownMs = cooldownMinutes * 60 * 1000;

        let cooldownRemaining = 0;
        let canPlacePixel = true;

        if (user?.lastPixelTime) {
          const timeSinceLastPixel = Date.now() - user.lastPixelTime.getTime();
          if (timeSinceLastPixel < cooldownMs) {
            cooldownRemaining = (cooldownMs - timeSinceLastPixel) / 1000;
            canPlacePixel = false;
          }
        }

        return {
          user: user || null,
          cooldown: {
            canPlacePixel,
            remainingSeconds: Math.ceil(cooldownRemaining),
            cooldownMinutes,
          },
        };
      } catch (error) {
        console.error('Error fetching user cooldown status:', error);

        // 데이터베이스 오류 시 폴백
        try {
          // 메모리 기반 쿨다운 체크
          const cooldownMinutes = parseInt(process.env.PIXEL_COOLDOWN_MINUTES || '1');
          const cooldownMs = cooldownMinutes * 60 * 1000;

          let cooldownRemaining = 0;
          let canPlacePixel = true;

          if (!global.userPixelTimes) {
            global.userPixelTimes = {};
          }

          const lastPixelTime = global.userPixelTimes[ctx.userId];
          if (lastPixelTime) {
            const timeSinceLastPixel = Date.now() - lastPixelTime;
            if (timeSinceLastPixel < cooldownMs) {
              cooldownRemaining = (cooldownMs - timeSinceLastPixel) / 1000;
              canPlacePixel = false;
            }
          }

          return {
            user: {
              id: ctx.userId,
              username: null,
              lastPixelTime: lastPixelTime ? new Date(lastPixelTime) : null,
              createdAt: new Date(),
            },
            cooldown: {
              canPlacePixel,
              remainingSeconds: Math.ceil(cooldownRemaining),
              cooldownMinutes,
            },
            warning: 'Using in-memory cooldown tracking (database unavailable)',
          };
        } catch (fallbackError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
            cause: error,
          });
        }
      }
    }),

  // 추가 사용자 관련 프로시저
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { clerkId: ctx.userId },
          include: {
            _count: {
              select: { pixels: true },
            },
          },
        });

        if (!user) {
          return {
            totalPixelsPlaced: 0,
            joinedAt: null,
          };
        }

        return {
          totalPixelsPlaced: user._count.pixels,
          joinedAt: user.createdAt,
        };
      } catch (error) {
        console.error('Error fetching user stats:', error);

        // 폴백: 기본값 반환
        return {
          totalPixelsPlaced: 0,
          joinedAt: null,
          warning: 'Stats unavailable (database error)',
        };
      }
    }),
});