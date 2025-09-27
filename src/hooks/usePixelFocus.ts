// import { useEffect, useState } from "react";
import { usePixelStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";
// import { gridToLatLng } from "@/lib/grid-utils";
// import { getRegionFromCoords } from "@/lib/region-utils";
import { toast } from "sonner";

export function usePixelFocus() {
  const { focusedPixel, setFocusedPixel, selectedColor, setSelectedColor, setPaintMode } =
    usePixelStore();
  // const [region, setRegion] = useState<string>("");
  // const [loadingRegion, setLoadingRegion] = useState(false);
  const utils = trpc.useUtils();

  const { data: pixelData, isLoading: pixelLoading } =
    trpc.pixel.getByCoordinate.useQuery(
      { x: focusedPixel?.x ?? 0, y: focusedPixel?.y ?? 0 },
      { enabled: !!focusedPixel }
    );

  const createPixelMutation = trpc.pixel.create.useMutation({
    onSuccess: (data) => {
      toast.success("✅ 픽셀이 배치되었습니다!");
      utils.pixel.getAll.invalidate();
      utils.pixel.getByCoordinate.invalidate();
      utils.user.getRemainingPixels.invalidate();
      setFocusedPixel(null);
      setPaintMode(false);
    },
    onError: (error: any) => {
      if (error.data?.code === "TOO_MANY_REQUESTS") {
        const cause = error.cause as any;
        const remaining = cause?.remainingSeconds;
        toast.error("🚫 픽셀 제한!", {
          description: `1분에 5개까지 배치 가능합니다. ${remaining ? `${remaining}초 후` : "잠시 후"} 리셋됩니다.`,
          duration: 5000,
        });
      } else {
        toast.error("❌ 픽셀 배치 실패", {
          description: error.message || "다시 시도해주세요.",
        });
      }
    },
  });

  // useEffect(() => {
  //   if (focusedPixel) {
  //     setLoadingRegion(true);
  //     const { lat, lng } = gridToLatLng(focusedPixel.x, focusedPixel.y);

  //     getRegionFromCoords(lat, lng)
  //       .then((regionName) => {
  //         setRegion(regionName);
  //       })
  //       .catch((error) => {
  //         console.error("Failed to get region:", error);
  //         setRegion("위치 정보 없음");
  //       })
  //       .finally(() => {
  //         setLoadingRegion(false);
  //       });
  //   } else {
  //     setRegion("");
  //   }
  // }, [focusedPixel]);

  const handlePaint = () => {
    if (!focusedPixel) {
      return;
    }

    createPixelMutation.mutate({
      x: focusedPixel.x,
      y: focusedPixel.y,
      color: selectedColor,
    });
  };

  return {
    focusedPixel,
    setFocusedPixel,
    // region,
    // loadingRegion,
    pixelData,
    pixelLoading,
    selectedColor,
    setSelectedColor,
    handlePaint,
    isPainting: createPixelMutation.isPending,
  };
}