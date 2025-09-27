"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { usePixelStore } from "@/lib/store";

export default function ZoomToPixels() {
  const currentZoom = usePixelStore((state) => state.currentZoom);

  const handleZoomToPixels = () => {
    const event = new CustomEvent("mapZoomToPixels");
    window.dispatchEvent(event);
  };

  if (currentZoom >= 15) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <Button
        onClick={handleZoomToPixels}
        variant="secondary"
        className="rounded-lg shadow-lg backdrop-blur-sm"
      >
        <Search className="h-4 w-4" />
        픽셀을 보려면 확대하세요
      </Button>
    </div>
  );
}
