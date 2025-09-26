"use client";

import { usePixelStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Palette, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";

export default function PaintButton() {
  const { isPaintMode, setPaintMode, currentZoom } = usePixelStore();
  const { isSignedIn } = useAuth();
  const minZoom = 15;

  const togglePaintMode = () => {
    if (!isSignedIn) {
      return;
    }

    if (currentZoom < minZoom) {
      toast.error("Zoom to paint!", {
        description: `Current zoom: ${Math.round(currentZoom)} / Required: ${minZoom}+`,
        duration: 3000,
      });
      return;
    }
    setPaintMode(!isPaintMode);
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button
          variant="default"
          size="lg"
          className="rounded-full shadow-xl"
        >
          <Palette className="w-5 h-5" />
          Paint
        </Button>
      </SignInButton>
    );
  }

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
