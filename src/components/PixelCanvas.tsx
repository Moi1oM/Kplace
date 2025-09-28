"use client";

import { useEffect, useRef, useState } from "react";
import { usePixelStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { createPixelOverlay, Pixel } from "@/lib/PixelOverlay";
import { latLngToGrid } from "@/lib/grid-utils";
import { toast } from "sonner";

interface PixelCanvasProps {
  mapRef?: React.RefObject<any>;
}

const MIN_ZOOM = 15;

export default function PixelCanvas({ mapRef }: PixelCanvasProps) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [lockedPixels, setLockedPixels] = useState<Set<string>>(new Set());
  const { currentZoom, canPaint, isPaintMode, selectedColor, setFocusedPixel, setViewedPixel, viewedPixel } = usePixelStore();
  const utils = trpc.useUtils();
  const overlayRef = useRef<any | null>(null);
  const updateBoundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isVisible = currentZoom >= MIN_ZOOM;

  const [visibleBounds, setVisibleBounds] = useState<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  const { data: pixelData } = trpc.pixel.getAll.useQuery(
    visibleBounds
      ? {
          minX: visibleBounds.minX,
          maxX: visibleBounds.maxX,
          minY: visibleBounds.minY,
          maxY: visibleBounds.maxY,
        }
      : {
          minX: 0,
          maxX: 0,
          minY: 0,
          maxY: 0,
        },
    {
      enabled: isVisible && visibleBounds !== null,
      refetchInterval: 30000,
      staleTime: 20000,
    }
  );

  useEffect(() => {
    if (pixelData?.pixels) {
      setPixels(pixelData.pixels);

      if (process.env.NODE_ENV === "development" && pixelData.pixels.length > 0) {
        console.log("[PixelCanvas] Loaded pixels:", {
          count: pixelData.pixels.length,
          bounds: visibleBounds,
        });
      }
    }
  }, [pixelData]);

  useEffect(() => {
    const checkLockedPixels = async () => {
      if (!pixelData?.pixels || pixelData.pixels.length === 0) {
        setLockedPixels(new Set());
        return;
      }

      const cooldownHours = parseInt(
        process.env.NEXT_PUBLIC_PIXEL_MODIFICATION_COOLDOWN_HOURS || '2'
      );
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const now = Date.now();

      const locked = new Set<string>();

      for (const pixel of pixelData.pixels) {
        try {
          const response = await fetch(
            `/api/trpc/pixel.getByCoordinate?batch=1&input=${encodeURIComponent(
              JSON.stringify({
                "0": {
                  json: { x: pixel.x, y: pixel.y }
                }
              })
            )}`
          );
          const data = await response.json();
          const pixelInfo = data?.[0]?.result?.data;

          if (pixelInfo?.createdAt) {
            const createdAt = new Date(pixelInfo.createdAt).getTime();
            const timeSince = now - createdAt;

            if (timeSince < cooldownMs) {
              locked.add(`${pixel.x},${pixel.y}`);
            }
          }
        } catch (error) {
          console.error(`Failed to check lock status for pixel ${pixel.x},${pixel.y}:`, error);
        }
      }

      setLockedPixels(locked);
    };

    checkLockedPixels();
  }, [pixelData]);

  const createPixelMutation = trpc.pixel.create.useMutation({
    onSuccess: (data) => {
      if (data.pixel) {
        setPixels((prev) => {
          const filtered = prev.filter(
            (p) => !(p.x === data.pixel.x && p.y === data.pixel.y)
          );
          return [...filtered, data.pixel];
        });
      }
      utils.pixel.getAll.invalidate();
    },
    onError: (error) => {
      console.error("[PixelCanvas] Create pixel error:", error);

      if (error instanceof TRPCClientError) {
        if (error.data?.code === "TOO_MANY_REQUESTS") {
          const cause = error.cause as any;

          if (cause?.pixelCooldown) {
            toast.error("⏱️ 픽셀 수정 쿨다운", {
              description: `이 픽셀은 ${cause.remainingMinutes}분 후에 수정할 수 있습니다.`,
              duration: 5000,
            });
          } else {
            const remaining = cause?.remainingSeconds;
            toast.error("⏱️ 쿨다운 중입니다!", {
              description: `${remaining ? `${remaining}초 후` : "잠시 후"} 다시 시도해주세요.`,
              duration: 3000,
            });
          }
        } else if (error.data?.code === "UNAUTHORIZED") {
          toast.error("🔐 로그인이 필요합니다", {
            description: "페이지를 새로고침하여 다시 로그인해주세요.",
          });
        } else if (error.data?.code === "BAD_REQUEST") {
          toast.error("❌ 잘못된 요청입니다", {
            description: "유효한 위치를 선택해주세요.",
          });
        } else if (error.data?.code === "INTERNAL_SERVER_ERROR") {
          toast.error("🔧 서버 오류가 발생했습니다", {
            description: "잠시 후 다시 시도해주세요.",
          });
        } else {
          toast.error("❌ 픽셀 배치 실패", {
            description: `오류: ${error.message}`,
          });
        }
      } else {
        console.error("Unexpected error:", error);
        toast.error("❌ 알 수 없는 오류가 발생했습니다", {
          description: "페이지를 새로고침해주세요.",
        });
      }
    },
  });

  useEffect(() => {
    if (!mapRef?.current || !isVisible) return;

    const mapInstance = mapRef.current.getMapInstance();
    if (!mapInstance || !window.naver?.maps) return;

    const overlay = createPixelOverlay({
      pixels,
      isPaintMode,
      canPaint,
      selectedColor,
      currentZoom,
      minZoom: MIN_ZOOM,
      viewedPixel,
      lockedPixels,
      onPixelClick: (x, y) => {
        if (!isPaintMode) {
          setViewedPixel({ x, y });
        }
      },
      onPixelCreate: (x, y, color) => {
        createPixelMutation.mutate({ x, y, color });
      },
      onPixelHover: (x, y) => {
        if (isPaintMode) {
          setFocusedPixel({ x, y });
        }
      },
    });

    overlay.setMap(mapInstance);
    overlayRef.current = overlay;

    const updateBounds = () => {
      if (updateBoundsTimeoutRef.current) {
        clearTimeout(updateBoundsTimeoutRef.current);
      }

      updateBoundsTimeoutRef.current = setTimeout(() => {
        const bounds = mapInstance.getBounds();
        const topLeft = latLngToGrid(bounds.getNE().lat(), bounds.getSW().lng());
        const bottomRight = latLngToGrid(bounds.getSW().lat(), bounds.getNE().lng());

        const bufferX = Math.ceil((bottomRight.x - topLeft.x) * 0.2);
        const bufferY = Math.ceil((bottomRight.y - topLeft.y) * 0.2);

        const newBounds = {
          minX: Math.max(0, topLeft.x - bufferX),
          maxX: Math.min(40000 - 1, bottomRight.x + bufferX),
          minY: Math.max(0, topLeft.y - bufferY),
          maxY: Math.min(80000 - 1, bottomRight.y + bufferY),
        };

        setVisibleBounds((prev) => {
          if (!prev) return newBounds;

          const threshold = 10;
          const hasSignificantChange =
            Math.abs(prev.minX - newBounds.minX) > threshold ||
            Math.abs(prev.maxX - newBounds.maxX) > threshold ||
            Math.abs(prev.minY - newBounds.minY) > threshold ||
            Math.abs(prev.maxY - newBounds.maxY) > threshold;

          return hasSignificantChange ? newBounds : prev;
        });
      }, 300);
    };

    setTimeout(updateBounds, 100);

    const dragEndListener = naver.maps.Event.addListener(mapInstance, "dragend", updateBounds);
    const zoomChangedListener = naver.maps.Event.addListener(mapInstance, "zoom_changed", updateBounds);

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
      naver.maps.Event.removeListener(dragEndListener);
      naver.maps.Event.removeListener(zoomChangedListener);
      if (updateBoundsTimeoutRef.current) {
        clearTimeout(updateBoundsTimeoutRef.current);
      }
    };
  }, [mapRef, isVisible, setFocusedPixel, isPaintMode]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.updatePixels(pixels);
    }
  }, [pixels]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.updatePaintMode(isPaintMode, canPaint, selectedColor, currentZoom);
    }
  }, [isPaintMode, canPaint, selectedColor, currentZoom]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.updateViewedPixel(viewedPixel);
    }
  }, [viewedPixel]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.updateLockedPixels(lockedPixels);
    }
  }, [lockedPixels]);

  return null;
}