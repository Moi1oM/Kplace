"use client";

import { useEffect, useRef, useState } from "react";
import { usePixelStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { createPixelOverlay, Pixel } from "@/lib/PixelOverlay";
import { latLngToGrid } from "@/lib/grid-utils";

interface PixelCanvasProps {
  mapRef?: React.RefObject<any>;
}

const MIN_ZOOM = 12;

export default function PixelCanvas({ mapRef }: PixelCanvasProps) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const { currentZoom, canPaint, isPaintMode, selectedColor } = usePixelStore();
  const utils = trpc.useUtils();
  const overlayRef = useRef<any | null>(null);

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
      refetchInterval: 10000,
      staleTime: 5000,
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
  }, [pixelData, visibleBounds]);

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
          alert(
            `⏱️ 쿨다운 중입니다!\n${remaining ? `${remaining}초 후` : "잠시 후"} 다시 시도해주세요.`
          );
        } else if (error.data?.code === "UNAUTHORIZED") {
          alert("🔐 로그인이 필요합니다.\n페이지를 새로고침하여 다시 로그인해주세요.");
        } else if (error.data?.code === "BAD_REQUEST") {
          alert("❌ 잘못된 요청입니다.\n유효한 위치를 선택해주세요.");
        } else if (error.data?.code === "INTERNAL_SERVER_ERROR") {
          alert("🔧 서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
        } else {
          alert(`❌ 픽셀 배치 실패\n오류: ${error.message}`);
        }
      } else {
        console.error("Unexpected error:", error);
        alert("❌ 알 수 없는 오류가 발생했습니다.\n페이지를 새로고침해주세요.");
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
      onPixelCreate: (x, y, color) => {
        createPixelMutation.mutate({ x, y, color });
      },
    });

    overlay.setMap(mapInstance);
    overlayRef.current = overlay;

    const updateBounds = () => {
      const bounds = mapInstance.getBounds();
      const topLeft = latLngToGrid(bounds.getNE().lat(), bounds.getSW().lng());
      const bottomRight = latLngToGrid(bounds.getSW().lat(), bounds.getNE().lng());

      const bufferX = Math.ceil((bottomRight.x - topLeft.x) * 0.05);
      const bufferY = Math.ceil((bottomRight.y - topLeft.y) * 0.05);

      setVisibleBounds({
        minX: Math.max(0, topLeft.x - bufferX),
        maxX: Math.min(40000 - 1, bottomRight.x + bufferX),
        minY: Math.max(0, topLeft.y - bufferY),
        maxY: Math.min(80000 - 1, bottomRight.y + bufferY),
      });
    };

    setTimeout(updateBounds, 100);

    const dragEndListener = naver.maps.Event.addListener(mapInstance, "dragend", updateBounds);
    const zoomChangedListener = naver.maps.Event.addListener(mapInstance, "zoom_changed", updateBounds);

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
      naver.maps.Event.removeListener(dragEndListener);
      naver.maps.Event.removeListener(zoomChangedListener);
    };
  }, [mapRef, isVisible]);

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

  return null;
}