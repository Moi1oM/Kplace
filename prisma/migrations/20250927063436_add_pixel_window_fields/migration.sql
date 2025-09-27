-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "pixelCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pixelWindowStartTime" TIMESTAMP(3);
