-- CreateEnum
CREATE TYPE "public"."Community" AS ENUM ('DC', 'FM', 'THEQOO', 'PPOMPPU', 'RULIWEB', 'INVEN', 'MLBPARK', 'ARCALIVE', 'NATEPANN', 'CLIEN', 'BOBAE', 'INSTIZ', 'HUMORUNIV', 'ORBI', 'ETC');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "community" "public"."Community";
