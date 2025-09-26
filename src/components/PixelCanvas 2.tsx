"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { usePixelStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
import { TRPCClientError } from "@trpc/client";

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface PixelCanvasProps {
  mapRef?: React.RefObject<any>;
}

// Define Korea bounds for grid mapping (approximate bounds)
const KOREA_BOUNDS = {
  minLat: 33.0, // Jeju southern tip
  maxLat: 39.0, // Northern border
  minLng: 124.5, // Western islands
  maxLng: 131.5, // Eastern islands (Dokdo)
};

const GRID_SIZE = 1000; // 1000x1000 grid

// Convert grid coordinates to lat/lng
function gridToLatLng(x: number, y: number) {
  const lat =
    KOREA_BOUNDS.minLat +
    (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat) * (1 - y / GRID_SIZE);
  const lng =
    KOREA_BOUNDS.minLng +
    (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng) * (x / GRID_SIZE);
  return { lat, lng };
}

// Convert lat/lng to grid coordinates
function latLngToGrid(lat: number, lng: number) {
  const x = Math.floor(
    ((lng - KOREA_BOUNDS.minLng) /
      (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng)) *
      GRID_SIZE
  );
  const y = Math.floor(
    (1 -
      (lat - KOREA_BOUNDS.minLat) /
        (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat)) *
      GRID_SIZE
  );
  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
    y: Math.max(0, Math.min(GRID_SIZE - 1, y)),
  };
}

const PixelCanvas = memo(function PixelCanvas({ mapRef }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const { currentZoom, canPaint, isPaintMode, selectedColor } = usePixelStore();
  const utils = trpc.useUtils();
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastHoverPosRef = useRef<{ x: number; y: number } | null>(null);

  // 디버깅용 상태 로그
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[PixelCanvas Debug]', {
        currentZoom,
        canPaint,
        isPaintMode,
        selectedColor,
        isVisible: currentZoom >= MIN_ZOOM,
        pixelsCount: pixels.length
      });
    }
  }, [currentZoom, canPaint, isPaintMode, selectedColor, pixels.length]);

  const MIN_ZOOM = 12;

  // Only show canvas when zoom level is sufficient
  const isVisible = currentZoom >= MIN_ZOOM;

  // tRPC query for fetching pixels with optimized settings
  const { data: pixelData } = trpc.pixel.getAll.useQuery(
    {
      minX: 0,
      maxX: GRID_SIZE,
      minY: 0,
      maxY: GRID_SIZE,
    },
    {
      enabled: isVisible,
      refetchInterval: 10000, // 10 seconds instead of 5
      staleTime: 5000, // Consider data fresh for 5 seconds
    }
  );

  // Update local pixels when query data changes
  useEffect(() => {
    if (pixelData?.pixels) {
      setPixels(pixelData.pixels);
    }
  }, [pixelData]);

  // tRPC mutation for creating pixels
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
          alert(`⏱️ 쿨다운 중입니다!\n${remaining ? `${remaining}초 후` : '잠시 후'} 다시 시도해주세요.`);
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

  // Calculate pixel size
  const getPixelSize = useCallback(() => {
    return Math.pow(2, currentZoom - 10) / 100;
  }, [currentZoom]);

  // Draw pixels on the main canvas
  const drawPixels = useCallback(() => {
    if (!canvasRef.current || !isVisible || !mapRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mapInstance = mapRef.current.getMapInstance();
    if (!mapInstance || !window.naver?.maps) return;

    const pixelSize = getPixelSize();

    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current map bounds and projection
    const bounds = mapInstance.getBounds();
    const projection = mapInstance.getProjection();

    // Draw grid lines if zoomed in enough
    if (currentZoom >= 20) {
      ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      ctx.lineWidth = 0.5;

      // Calculate grid lines based on geographic coordinates
      const minLat = Math.max(bounds.getSW().lat(), KOREA_BOUNDS.minLat);
      const maxLat = Math.min(bounds.getNE().lat(), KOREA_BOUNDS.maxLat);
      const minLng = Math.max(bounds.getSW().lng(), KOREA_BOUNDS.minLng);
      const maxLng = Math.min(bounds.getNE().lng(), KOREA_BOUNDS.maxLng);

      // Draw grid based on geographic coordinates
      for (let gridX = 0; gridX < GRID_SIZE; gridX += 10) {
        const { lat, lng } = gridToLatLng(gridX, 0);
        if (lng >= minLng && lng <= maxLng) {
          const latLng = new window.naver.maps.LatLng(
            bounds.getCenter().lat(),
            lng
          );
          const point = projection.fromCoordToContainerPoint(latLng);
          if (point.x >= 0 && point.x <= canvas.width) {
            ctx.beginPath();
            ctx.moveTo(point.x, 0);
            ctx.lineTo(point.x, canvas.height);
            ctx.stroke();
          }
        }
      }

      for (let gridY = 0; gridY < GRID_SIZE; gridY += 10) {
        const { lat, lng } = gridToLatLng(0, gridY);
        if (lat >= minLat && lat <= maxLat) {
          const latLng = new window.naver.maps.LatLng(
            lat,
            bounds.getCenter().lng()
          );
          const point = projection.fromCoordToContainerPoint(latLng);
          if (point.y >= 0 && point.y <= canvas.height) {
            ctx.beginPath();
            ctx.moveTo(0, point.y);
            ctx.lineTo(canvas.width, point.y);
            ctx.stroke();
          }
        }
      }
    }

    // Draw existing pixels at their geographic positions
    pixels.forEach((pixel) => {
      // Convert grid coordinates to lat/lng
      const { lat, lng } = gridToLatLng(pixel.x, pixel.y);

      // Check if pixel is within current map bounds
      if (
        lat < bounds.getSW().lat() ||
        lat > bounds.getNE().lat() ||
        lng < bounds.getSW().lng() ||
        lng > bounds.getNE().lng()
      ) {
        return; // Skip pixels outside current view
      }

      // Convert lat/lng to screen coordinates
      const latLng = new window.naver.maps.LatLng(lat, lng);
      const point = projection.fromCoordToContainerPoint(latLng);

      // Draw pixel at screen position
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );

      // Add border to pixels
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.strokeRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );
    });
  }, [isVisible, currentZoom, pixels, getPixelSize, mapRef]);

  // Draw hover preview on the hover canvas
  const drawHoverPreview = useCallback(
    (mouseX: number, mouseY: number) => {
      if (
        !hoverCanvasRef.current ||
        !isPaintMode ||
        !mapRef?.current
      )
        return;

      const canvas = hoverCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const mapInstance = mapRef.current.getMapInstance();
      if (!mapInstance || !window.naver?.maps) return;

      const pixelSize = getPixelSize();
      const rect = canvas.getBoundingClientRect();
      const projection = mapInstance.getProjection();

      // Convert screen coordinates to lat/lng
      const point = new window.naver.maps.Point(
        mouseX - rect.left,
        mouseY - rect.top
      );
      const latLng = projection.fromContainerPointToCoord(point);

      // Convert lat/lng to grid coordinates
      const { x, y } = latLngToGrid(latLng.lat(), latLng.lng());

      // Only redraw if position changed
      if (
        lastHoverPosRef.current &&
        lastHoverPosRef.current.x === x &&
        lastHoverPosRef.current.y === y
      ) {
        return;
      }

      lastHoverPosRef.current = { x, y };

      // Clear hover canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Convert grid back to lat/lng for drawing
      const { lat, lng } = gridToLatLng(x, y);
      const hoverLatLng = new window.naver.maps.LatLng(lat, lng);
      const hoverPoint = projection.fromCoordToContainerPoint(hoverLatLng);

      // Draw hover preview at the snapped position
      if (canPaint) {
        // Normal hover preview when painting is allowed
        ctx.fillStyle = selectedColor + "80"; // Semi-transparent
        ctx.fillRect(
          hoverPoint.x - pixelSize / 2,
          hoverPoint.y - pixelSize / 2,
          pixelSize,
          pixelSize
        );
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          hoverPoint.x - pixelSize / 2,
          hoverPoint.y - pixelSize / 2,
          pixelSize,
          pixelSize
        );
      } else {
        // Red outline when painting is not allowed (zoom level too low, not logged in, etc.)
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.strokeRect(
          hoverPoint.x - pixelSize / 2,
          hoverPoint.y - pixelSize / 2,
          pixelSize,
          pixelSize
        );
        ctx.setLineDash([]); // Reset line dash

        // Add X mark to indicate not allowed
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        const centerX = hoverPoint.x;
        const centerY = hoverPoint.y;
        const markSize = pixelSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(centerX - markSize, centerY - markSize);
        ctx.lineTo(centerX + markSize, centerY + markSize);
        ctx.moveTo(centerX + markSize, centerY - markSize);
        ctx.lineTo(centerX - markSize, centerY + markSize);
        ctx.stroke();
      }
    },
    [isPaintMode, canPaint, selectedColor, getPixelSize, mapRef]
  );

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPaintMode || !canvasRef.current || !mapRef?.current) return;

      // If paint is not allowed, show specific reason
      if (!canPaint) {
        if (currentZoom < MIN_ZOOM) {
          alert(`줌을 ${MIN_ZOOM} 이상으로 확대해주세요. 현재 줌 레벨: ${Math.round(currentZoom)}`);
        } else {
          alert("로그인이 필요하거나 쿨다운 시간이 남아있습니다.");
        }
        return;
      }

      const mapInstance = mapRef.current.getMapInstance();
      if (!mapInstance || !window.naver?.maps) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const projection = mapInstance.getProjection();

      // Convert click position to lat/lng
      const point = new window.naver.maps.Point(
        event.clientX - rect.left,
        event.clientY - rect.top
      );
      const latLng = projection.fromContainerPointToCoord(point);

      // Convert lat/lng to grid coordinates
      const { x, y } = latLngToGrid(latLng.lat(), latLng.lng());

      createPixelMutation.mutate({
        x,
        y,
        color: selectedColor,
      });
    },
    [isPaintMode, canPaint, selectedColor, createPixelMutation, mapRef]
  );

  // Handle mouse move with requestAnimationFrame
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPaintMode) {
        if (hoverCanvasRef.current) {
          const ctx = hoverCanvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(
              0,
              0,
              hoverCanvasRef.current.width,
              hoverCanvasRef.current.height
            );
          }
        }
        lastHoverPosRef.current = null;
        return;
      }

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule new animation frame
      animationFrameRef.current = requestAnimationFrame(() => {
        drawHoverPreview(event.clientX, event.clientY);
      });
    },
    [isPaintMode, drawHoverPreview]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoverCanvasRef.current) {
      const ctx = hoverCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          hoverCanvasRef.current.width,
          hoverCanvasRef.current.height
        );
      }
    }
    lastHoverPosRef.current = null;
  }, []);

  // Set up canvases
  useEffect(() => {
    if (!isVisible) return;

    const resizeCanvases = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
      if (hoverCanvasRef.current) {
        hoverCanvasRef.current.width = window.innerWidth;
        hoverCanvasRef.current.height = window.innerHeight;
      }
      drawPixels();
    };

    // Handle map move event
    const handleMapMoved = () => {
      drawPixels();
    };

    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    window.addEventListener("mapMoved", handleMapMoved);

    return () => {
      window.removeEventListener("resize", resizeCanvases);
      window.removeEventListener("mapMoved", handleMapMoved);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, drawPixels]);

  // Redraw pixels when they change or zoom changes
  useEffect(() => {
    drawPixels();
  }, [drawPixels]);

  // Update cursor style
  useEffect(() => {
    if (hoverCanvasRef.current) {
      if (isPaintMode && canPaint) {
        hoverCanvasRef.current.style.cursor = "crosshair";
      } else if (isPaintMode && !canPaint) {
        hoverCanvasRef.current.style.cursor = "not-allowed";
      } else {
        hoverCanvasRef.current.style.cursor = "default";
      }
    }
  }, [isPaintMode, canPaint]);

  if (!isVisible) return null;

  return (
    <>
      {/* Main pixel canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          mixBlendMode: "normal",
        }}
      />
      {/* Hover preview canvas */}
      <canvas
        ref={hoverCanvasRef}
        className={`absolute inset-0 z-11 ${
          isPaintMode ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          mixBlendMode: "normal",
        }}
      />
    </>
  );
});

export default PixelCanvas;
