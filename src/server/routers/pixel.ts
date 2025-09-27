import { router, publicProcedure, rateLimitedProcedure } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import {
  createPixelSchema,
  getPixelsSchema,
  getPixelByCoordinateSchema,
} from "../schemas";
import type { Pixel } from "@prisma/client";

export const pixelRouter = router({
  // 특정 좌표의 픽셀 조회 (공개)
  getByCoordinate: publicProcedure
    .input(getPixelByCoordinateSchema)
    .query(async ({ ctx, input }) => {
      const { x, y } = input;

      try {
        const pixel = await ctx.prisma.pixel.findFirst({
          where: {
            x,
            y,
            isActive: true,
          },
          include: {
            user: {
              select: {
                username: true,
                clerkId: true,
              },
            },
          },
        });

        if (!pixel) {
          return null;
        }

        return {
          x: pixel.x,
          y: pixel.y,
          color: pixel.color,
          userId: pixel.userId,
          createdAt: pixel.createdAt,
          user: {
            username: pixel.user.username,
          },
        };
      } catch (error) {
        console.error("Error fetching pixel by coordinate:", error);
        return null;
      }
    }),

  // 픽셀 조회 (공개)
  getAll: publicProcedure
    .input(getPixelsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const whereClause: any = { isActive: true };

        if (input.minX !== undefined && input.maxX !== undefined) {
          whereClause.x = { gte: input.minX, lte: input.maxX };
        }
        if (input.minY !== undefined && input.maxY !== undefined) {
          whereClause.y = { gte: input.minY, lte: input.maxY };
        }

        const pixels = await ctx.prisma.pixel.findMany({
          where: whereClause,
          select: {
            x: true,
            y: true,
            color: true,
          },
        });

        return { pixels };
      } catch (error) {
        console.error(
          "Database error, falling back to in-memory storage:",
          error
        );

        // DB 실패 시 폴백
        if (!global.pixelsStorage) {
          global.pixelsStorage = [];
        }

        // 범위 필터링 적용
        let filteredPixels = global.pixelsStorage;

        if (input.minX !== undefined && input.maxX !== undefined) {
          filteredPixels = filteredPixels.filter(
            (p) => p.x >= input.minX! && p.x <= input.maxX!
          );
        }
        if (input.minY !== undefined && input.maxY !== undefined) {
          filteredPixels = filteredPixels.filter(
            (p) => p.y >= input.minY! && p.y <= input.maxY!
          );
        }

        return {
          pixels: filteredPixels,
          warning: "Using in-memory storage (database unavailable)",
        };
      }
    }),

  // 픽셀 생성 (인증 + 쿨다운)
  create: rateLimitedProcedure
    .input(createPixelSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "인증되지 않은 사용자입니다.",
        });
      }
      const { x, y, color } = input;

      try {
        // 사용자 확인 또는 생성
        let user = await ctx.prisma.user.findUnique({
          where: { clerkId: ctx.userId },
        });

        if (!user) {
          user = await ctx.prisma.user.create({
            data: { clerkId: ctx.userId },
          });
        }

        // 트랜잭션으로 픽셀 배치
        const result = await ctx.prisma.$transaction(async (tx) => {
          // 기존 픽셀 비활성화
          await tx.pixel.updateMany({
            where: { x, y, isActive: true },
            data: { isActive: false },
          });

          // 새 픽셀 생성
          const newPixel = await tx.pixel.create({
            data: {
              x,
              y,
              color,
              userId: user.id,
              isActive: true,
            },
          });

          // 쿨다운 업데이트
          await tx.user.update({
            where: { id: user.id },
            data: {
              lastPixelTime: new Date(),
              pixelWindowStartTime: user.pixelWindowStartTime || new Date(),
              pixelCount: { increment: 1 },
            },
          });

          return newPixel;
        });

        // 글로벌 스토리지 업데이트 (폴백용)
        if (!global.userPixelTimes) {
          global.userPixelTimes = {};
        }
        global.userPixelTimes[ctx.userId] = Date.now();

        return {
          success: true,
          pixel: {
            x: result.x,
            y: result.y,
            color: result.color,
          },
        };
      } catch (error) {
        // tRPC 에러는 그대로 전달
        if (error instanceof TRPCError) throw error;

        console.error("Error placing pixel:", error);

        // 데이터베이스 오류 시 폴백 처리
        try {
          // 폴백: 메모리에 픽셀 저장
          if (!global.userPixelTimes) {
            global.userPixelTimes = {};
          }

          // 쿨다운 체크 (메모리 기반)
          const cooldownMinutes = parseInt(
            process.env.PIXEL_COOLDOWN_MINUTES || "1"
          );
          const cooldownMs = cooldownMinutes * 60 * 1000;
          const lastPixelTime = global.userPixelTimes[ctx.userId];

          if (lastPixelTime) {
            const timeSinceLastPixel = Date.now() - lastPixelTime;
            if (timeSinceLastPixel < cooldownMs) {
              const remainingSeconds = Math.ceil(
                (cooldownMs - timeSinceLastPixel) / 1000
              );
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: `쿨다운 중입니다. ${remainingSeconds}초 후 다시 시도해주세요.`,
                cause: {
                  cooldown: true,
                  remainingSeconds,
                },
              });
            }
          }

          // 쿨다운 업데이트
          global.userPixelTimes[ctx.userId] = Date.now();

          // 픽셀을 메모리에 저장
          if (!global.pixelsStorage) {
            global.pixelsStorage = [];
          }

          // 기존 픽셀 제거
          global.pixelsStorage = global.pixelsStorage.filter(
            (p) => !(p.x === x && p.y === y)
          );

          // 새 픽셀 추가
          global.pixelsStorage.push({ x, y, color });

          return {
            success: true,
            pixel: { x, y, color },
            warning: "Pixel placed in memory only (database unavailable)",
          };
        } catch (fallbackError) {
          if (fallbackError instanceof TRPCError) throw fallbackError;

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "픽셀 배치 중 오류가 발생했습니다.",
            cause: error,
          });
        }
      }
    }),
});
