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
          const remaining = cause?.remainingSeconds;
          toast.error("⏱️ 쿨다운 중입니다!", {
            description: `${remaining ? `${remaining}초 후` : "잠시 후"} 다시 시도해주세요.`,
            duration: 3000,
          });
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

  return null;
}