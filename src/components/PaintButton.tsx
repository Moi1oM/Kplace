"use client";

import { usePixelStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Palette, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";

export default function PaintButton() {
  const { isPaintMode, setPaintMode, currentZoom, setFocusedPixel } = usePixelStore();
  const { isSignedIn } = useAuth();
  const minZoom = 15;

  const togglePaintMode = () => {
    if (!isSignedIn) {
      return;
    }

    if (currentZoom < minZoom) {
      toast.error("칠하려면 확대하세요.", {
        description: `현재 확대 정도: ${Math.round(currentZoom)} / 필요한 정도: ${minZoom}+`,
        duration: 3000,
      });
      return;
    }

    if (!isPaintMode) {
      setPaintMode(true);
      window.dispatchEvent(new CustomEvent("focusCenterPixel"));
    } else {
      setPaintMode(false);
      setFocusedPixel(null);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="default" size="lg" className="rounded-full shadow-xl">
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
          나가기
        </>
      ) : (
        <>
          <Palette className="w-5 h-5" />
          칠하기
        </>
      )}
    </Button>
  );
}
