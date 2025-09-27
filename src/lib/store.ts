import { create } from 'zustand'

interface PixelStore {
  isPaintMode: boolean
  selectedColor: string
  currentZoom: number
  canPaint: boolean
  focusedPixel: { x: number; y: number } | null
  setPaintMode: (mode: boolean) => void
  setSelectedColor: (color: string) => void
  setCurrentZoom: (zoom: number) => void
  setFocusedPixel: (pixel: { x: number; y: number } | null) => void
}

export const usePixelStore = create<PixelStore>((set) => ({
  isPaintMode: false,
  selectedColor: '#000000',
  currentZoom: 8,
  canPaint: false,
  focusedPixel: null,
  setPaintMode: (mode) => set({ isPaintMode: mode }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setCurrentZoom: (zoom) => set({
    currentZoom: zoom,
    canPaint: zoom >= 15
  }),
  setFocusedPixel: (pixel) => set({ focusedPixel: pixel }),
}))