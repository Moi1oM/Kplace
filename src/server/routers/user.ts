import { router, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Community } from '@prisma/client';
import { COMMUNITY_CHANGE_COOLDOWN_DAYS } from '@/lib/communities';

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

  getRemainingPixels: protectedProcedure
    .query(async ({ ctx }) => {
      const MAX_PIXELS = 5;
      const WINDOW_MS = 60 * 1000;

      const user = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        select: {
          pixelWindowStartTime: true,
          pixelCount: true,
        },
      });

      if (user?.pixelWindowStartTime) {
        const elapsed = Date.now() - user.pixelWindowStartTime.getTime();
        if (elapsed > WINDOW_MS) {
          return {
            remaining: MAX_PIXELS,
            total: MAX_PIXELS,
            resetAt: null,
          };
        }

        return {
          remaining: MAX_PIXELS - user.pixelCount,
          total: MAX_PIXELS,
          resetAt: new Date(user.pixelWindowStartTime.getTime() + WINDOW_MS),
        };
      }

      return {
        remaining: MAX_PIXELS,
        total: MAX_PIXELS,
        resetAt: null,
      };
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

  getCommunityInfo: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { clerkId: ctx.userId },
          select: {
            community: true,
            communitySetAt: true,
          },
        });

        if (!user) {
          return {
            community: null,
            canChange: true,
            daysRemaining: 0,
          };
        }

        const cooldownMs = COMMUNITY_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
        let canChange = true;
        let daysRemaining = 0;

        if (user.communitySetAt) {
          const timeSinceSet = Date.now() - user.communitySetAt.getTime();
          if (timeSinceSet < cooldownMs) {
            canChange = false;
            daysRemaining = Math.ceil((cooldownMs - timeSinceSet) / (24 * 60 * 60 * 1000));
          }
        }

        return {
          community: user.community,
          communitySetAt: user.communitySetAt,
          canChange,
          daysRemaining,
        };
      } catch (error) {
        console.error('Error fetching community info:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '커뮤니티 정보를 가져오는 중 오류가 발생했습니다.',
          cause: error,
        });
      }
    }),

  updateCommunity: protectedProcedure
    .input(z.object({
      community: z.nativeEnum(Community),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { clerkId: ctx.userId },
          select: {
            communitySetAt: true,
          },
        });

        if (user?.communitySetAt) {
          const cooldownMs = COMMUNITY_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
          const timeSinceSet = Date.now() - user.communitySetAt.getTime();

          if (timeSinceSet < cooldownMs) {
            const daysRemaining = Math.ceil((cooldownMs - timeSinceSet) / (24 * 60 * 60 * 1000));
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `커뮤니티는 ${daysRemaining}일 후에 변경할 수 있습니다.`,
            });
          }
        }

        const updatedUser = await ctx.prisma.user.update({
          where: { clerkId: ctx.userId },
          data: {
            community: input.community,
            communitySetAt: new Date(),
          },
          select: {
            id: true,
            username: true,
            community: true,
            communitySetAt: true,
          },
        });

        return {
          success: true,
          user: updatedUser,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating user community:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '커뮤니티 정보를 업데이트하는 중 오류가 발생했습니다.',
          cause: error,
        });
      }
    }),
});