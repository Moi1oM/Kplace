import { z } from 'zod';

// 픽셀 관련 스키마
export const pixelColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');

export const pixelCoordinateSchema = z.object({
  x: z.number().int().min(0).max(39999), // Updated for 40,000 width
  y: z.number().int().min(0).max(79999), // 80,000 height remains the same
});

export const createPixelSchema = z.object({
  ...pixelCoordinateSchema.shape,
  color: pixelColorSchema,
});

export const getPixelsSchema = z.object({
  minX: z.number().int().optional(),
  maxX: z.number().int().optional(),
  minY: z.number().int().optional(),
  maxY: z.number().int().optional(),
}).refine(
  (data) => {
    if (data.minX !== undefined && data.maxX !== undefined) {
      return data.minX <= data.maxX;
    }
    if (data.minY !== undefined && data.maxY !== undefined) {
      return data.minY <= data.maxY;
    }
    return true;
  },
  { message: "Invalid bounds: min values must be less than or equal to max values" }
);

// 사용자 관련 스키마
export const userIdSchema = z.string().min(1);

// 픽셀 응답 타입
export const pixelResponseSchema = z.object({
  x: z.number(),
  y: z.number(),
  color: z.string(),
});

export const pixelsResponseSchema = z.object({
  pixels: z.array(pixelResponseSchema),
  warning: z.string().optional(),
});

// 쿨다운 응답 타입
export const cooldownStatusSchema = z.object({
  canPlacePixel: z.boolean(),
  remainingSeconds: z.number(),
  cooldownMinutes: z.number(),
});

export const userResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    username: z.string().nullable(),
    lastPixelTime: z.date().nullable(),
    createdAt: z.date(),
  }).nullable(),
  cooldown: cooldownStatusSchema,
});

// 타입 내보내기
export type CreatePixelInput = z.infer<typeof createPixelSchema>;
export type GetPixelsInput = z.infer<typeof getPixelsSchema>;
export type PixelResponse = z.infer<typeof pixelResponseSchema>;
export type PixelsResponse = z.infer<typeof pixelsResponseSchema>;
export type CooldownStatus = z.infer<typeof cooldownStatusSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;