"use client";

import { usePixelFocus } from "@/hooks/usePixelFocus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePixelStore } from "@/lib/store";
import { trpc } from "@/lib/trpc/client";

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FF8800",
  "#88FF00",
  "#0088FF",
  "#8800FF",
  "#FF0088",
  "#808080",
  "#C0C0C0",
  "#800000",
];

export default function PixelFocusModal() {
  const {
    focusedPixel,
    setFocusedPixel,
    // region,
    // loadingRegion,
    pixelData,
    pixelLoading,
    selectedColor,
    setSelectedColor,
    handlePaint,
    isPainting,
  } = usePixelFocus();

  const { setPaintMode } = usePixelStore();
  const { data: remainingData } = trpc.user.getRemainingPixels.useQuery(
    undefined,
    { refetchInterval: 1000, enabled: !!focusedPixel }
  );

  if (!focusedPixel) return null;

  const handleClose = () => {
    setFocusedPixel(null);
    setPaintMode(false);
  };

  return (
    <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto sm:min-w-[400px] max-w-md shadow-2xl rounded-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            픽셀 : {focusedPixel.x}, {focusedPixel.y}
            {/* {loadingRegion ? (
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            ) : (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-normal">
                🇰🇷 {region}
              </span>
            )} */}
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
        {pixelLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading...
          </div>
        ) : pixelData ? (
          <div className="text-xs text-gray-600 flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: pixelData.color }}
            />
            <span className="text-center">
              Painted by {pixelData.user.username || "Anonymous"}
            </span>
          </div>
        ) : (
          <p className="text-center text-xs text-gray-600">Not painted</p>
        )}

        <div className="flex flex-col items-center">
          <p className="text-xs font-medium mb-2">색상 선택</p>
          <ToggleGroup
            type="single"
            value={selectedColor}
            onValueChange={(value) => value && setSelectedColor(value)}
            className="grid grid-cols-8 gap-1.5"
          >
            {COLORS.map((color) => (
              <ToggleGroupItem
                key={color}
                value={color}
                className={`w-8 h-8 rounded border-2 transition-all p-0 ${
                  selectedColor === color
                    ? "ring-2 ring-offset-2 ring-blue-600"
                    : ""
                }`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </ToggleGroup>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-600">선택된 색상:</span>
            <div
              className="w-4 h-4 rounded border-2 border-gray-400"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-xs font-mono text-gray-700">
              {selectedColor}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePaint}
          disabled={isPainting}
          className="w-full"
          size="sm"
        >
          {isPainting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Painting...
            </>
          ) : (
            `칠하기 ${remainingData?.remaining ?? 5}/${remainingData?.total ?? 5}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
