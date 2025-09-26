"use client";

import { memo } from "react";
import { usePixelStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Lime
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FF8800", // Orange
  "#88FF00", // Chartreuse
  "#0088FF", // Sky Blue
  "#8800FF", // Purple
  "#FF0088", // Rose
  "#808080", // Gray
  "#C0C0C0", // Silver
  "#800000", // Maroon
];

const ColorPalette = memo(function ColorPalette() {
  const { selectedColor, setSelectedColor, isPaintMode, canPaint, currentZoom } = usePixelStore();

  if (!isPaintMode) return null;

  return (
    <Card className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 shadow-xl">
      <CardContent className="p-4">
        {!canPaint && (
          <div className="mb-2 text-sm text-red-600 text-center space-y-1">
            <div className="font-semibold">🚫 Paint Mode Disabled</div>
            {currentZoom < 12 ? (
              <div>
                📏 Zoom in more to start painting
                <br />
                <span className="text-xs">Current: {Math.round(currentZoom)} | Required: 12+</span>
              </div>
            ) : (
              <div>
                🔐 Login required or cooldown in effect
                <br />
                <span className="text-xs">Check your login status</span>
              </div>
            )}
          </div>
        )}
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={selectedColor}
            onValueChange={(value) => value && canPaint && setSelectedColor(value)}
            className="grid grid-cols-8 gap-2"
          >
            {COLORS.map((color) => (
              <Tooltip key={color}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={color}
                    disabled={!canPaint}
                    className={`w-10 h-10 rounded border-2 transition-all p-0 ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-black"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{color}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
        </TooltipProvider>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600">Selected:</span>
          <div
            className="w-6 h-6 rounded border-2 border-black"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm font-mono text-gray-700">{selectedColor}</span>
        </div>
      </CardContent>
    </Card>
  );
});

export default ColorPalette;