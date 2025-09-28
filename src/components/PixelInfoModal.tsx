"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, X, User, Clock, Paintbrush, History, Lock } from "lucide-react";
import { usePixelStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import { COMMUNITIES } from "@/lib/communities";
import { formatTimeAgo } from "@/lib/date-utils";
import { useAuth, SignInButton } from "@clerk/nextjs";
import PixelHistoryModal from "./PixelHistoryModal";

export default function PixelInfoModal() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { viewedPixel, setViewedPixel, setPaintMode, setFocusedPixel, focusedPixel } = usePixelStore();

  const { data: pixelData, isLoading } = trpc.pixel.getByCoordinate.useQuery(
    { x: viewedPixel?.x ?? 0, y: viewedPixel?.y ?? 0 },
    { enabled: !!viewedPixel }
  );

  const { data: remainingData } = trpc.user.getRemainingPixels.useQuery(
    undefined,
    {
      enabled: isSignedIn && !!viewedPixel,
      refetchInterval: 1000
    }
  );

  const canPaint = isSignedIn && (remainingData?.remaining ?? 0) > 0 && !pixelData?.isLocked;

  if (!viewedPixel || focusedPixel) return null;

  const handleClose = () => {
    setViewedPixel(null);
  };

  const handlePaintClick = () => {
    if (!viewedPixel || !canPaint) return;

    setPaintMode(true);
    setFocusedPixel({ x: viewedPixel.x, y: viewedPixel.y });
  };

  return (
    <>
      <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[380px] max-w-md shadow-2xl rounded-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            Pixel: {viewedPixel.x}, {viewedPixel.y}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-4 pt-0 space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-600 py-4">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </div>
        ) : pixelData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border-2 border-gray-300"
                style={{ backgroundColor: pixelData.color }}
              />
              <span className="text-sm font-mono text-gray-700">
                {pixelData.color}
              </span>
            </div>

            {pixelData.user.community && (
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor:
                      COMMUNITIES[pixelData.user.community].color + "20",
                    color: COMMUNITIES[pixelData.user.community].color,
                    border: `1px solid ${COMMUNITIES[pixelData.user.community].color}40`,
                  }}
                >
                  {COMMUNITIES[pixelData.user.community].logoPath && (
                    <Image
                      src={COMMUNITIES[pixelData.user.community].logoPath}
                      alt={COMMUNITIES[pixelData.user.community].name}
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  )}
                  {COMMUNITIES[pixelData.user.community].name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">
                {pixelData.user.username || "Anonymous"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeAgo(pixelData.createdAt)}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-gray-600 py-4">
            No pixel data available
          </p>
        )}

        {pixelData?.isLocked && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <Lock className="w-3.5 h-3.5" />
            <span>
              이 픽셀은 <strong>{pixelData.remainingMinutes}분 후</strong>에 수정할 수 있습니다
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => setHistoryOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <History className="w-4 h-4 mr-2" />
            히스토리
          </Button>

          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button
                className="flex-1"
                variant="default"
                size="sm"
              >
                <Paintbrush className="w-4 h-4 mr-2" />
                로그인하고 칠하기
              </Button>
            </SignInButton>
          ) : (
            <Button
              onClick={handlePaintClick}
              disabled={!canPaint || pixelData?.isLocked}
              className="flex-1"
              variant="default"
              size="sm"
            >
              {pixelData?.isLocked ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  잠김
                </>
              ) : (
                <>
                  <Paintbrush className="w-4 h-4 mr-2" />
                  {canPaint
                    ? `칠하기 ${remainingData?.remaining ?? 0}/${remainingData?.total ?? 5}`
                    : "쿨다운 중..."}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      </Card>

      {viewedPixel && (
        <PixelHistoryModal
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          x={viewedPixel.x}
          y={viewedPixel.y}
        />
      )}
    </>
  );
}