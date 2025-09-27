"use client";

import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import CommunityButton from "./CommunityButton";

export default function ZoomControls() {
  const handleZoomIn = () => {
    const event = new CustomEvent("mapZoomIn");
    window.dispatchEvent(event);
  };

  const handleZoomOut = () => {
    const event = new CustomEvent("mapZoomOut");
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleZoomIn}
        variant="outline"
        size="icon"
        className="rounded-full shadow-lg"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleZoomOut}
        variant="outline"
        size="icon"
        className="rounded-full shadow-lg"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <CommunityButton />
    </div>
  );
}
