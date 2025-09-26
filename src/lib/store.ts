import { create } from 'zustand'

interface PixelStore {
  isPaintMode: boolean
  selectedColor: string
  currentZoom: number
  canPaint: boolean
  setPaintMode: (mode: boolean) => void
  setSelectedColor: (color: string) => void
  setCurrentZoom: (zoom: number) => void
}

export const usePixelStore = create<PixelStore>((set) => ({
  isPaintMode: false,
  selectedColor: '#000000',
  currentZoom: 8,
  canPaint: false,
  setPaintMode: (mode) => set({ isPaintMode: mode }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setCurrentZoom: (zoom) => set({
    currentZoom: zoom,
    canPaint: zoom >= 15
  }),
}))