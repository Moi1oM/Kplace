"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, MapPinOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MarkerToggle() {
  const [markersVisible, setMarkersVisible] = useState(true);

  const handleToggleMarkers = () => {
    const newVisibility = !markersVisible;
    setMarkersVisible(newVisibility);

    const event = new CustomEvent("toggleMarkers", {
      detail: { visible: newVisibility },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleToggleMarkers}
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg"
            >
              {markersVisible ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <MapPinOff className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{markersVisible ? "Hide markers" : "Show markers"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
