"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function ZoomToPixels() {
  const handleZoomToPixels = () => {
    const event = new CustomEvent("mapZoomToPixels");
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <Button
        onClick={handleZoomToPixels}
        variant="secondary"
        className="rounded-lg shadow-lg backdrop-blur-sm"
      >
        <Search className="h-4 w-4" />
        Zoom in to see the pixels
      </Button>
    </div>
  );
}
