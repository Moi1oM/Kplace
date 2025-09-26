"use client";

import { usePixelStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Palette, X } from "lucide-react";

export default function PaintButton() {
  const { isPaintMode, setPaintMode, currentZoom } = usePixelStore();
  const minZoom = 12;

  const togglePaintMode = () => {
    if (currentZoom < minZoom) {
      alert(
        `🔍 줌을 더 확대해주세요!\n\n` +
        `현재 줌 레벨: ${Math.round(currentZoom)}\n` +
        `필요한 줌 레벨: ${minZoom} 이상\n\n` +
        `지도를 더 확대한 후 다시 시도해주세요.`
      );
      return;
    }
    setPaintMode(!isPaintMode);
  };

  return (
    <Button
      onClick={togglePaintMode}
      variant={isPaintMode ? "destructive" : "default"}
      size="lg"
      className="rounded-full shadow-xl"
    >
      {isPaintMode ? (
        <>
          <X className="w-5 h-5" />
          Exit Paint
        </>
      ) : (
        <>
          <Palette className="w-5 h-5" />
          Paint
        </>
      )}
    </Button>
  );
}
