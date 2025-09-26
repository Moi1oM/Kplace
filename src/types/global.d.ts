declare global {
  var userPixelTimes: Record<string, number> | undefined;
  var pixelsStorage: Array<{ x: number; y: number; color: string }> | undefined;
}

export {};