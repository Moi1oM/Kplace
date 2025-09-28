import { create } from 'zustand'
import { Community } from '@prisma/client'

interface PixelStore {
  isPaintMode: boolean
  selectedColor: string
  currentZoom: number
  canPaint: boolean
  focusedPixel: { x: number; y: number } | null
  viewedPixel: { x: number; y: number } | null
  setPaintMode: (mode: boolean) => void
  setSelectedColor: (color: string) => void
  setCurrentZoom: (zoom: number) => void
  setFocusedPixel: (pixel: { x: number; y: number } | null) => void
  setViewedPixel: (pixel: { x: number; y: number } | null) => void
}

export const usePixelStore = create<PixelStore>((set) => ({
  isPaintMode: false,
  selectedColor: '#000000',
  currentZoom: 8,
  canPaint: false,
  focusedPixel: null,
  viewedPixel: null,
  setPaintMode: (mode) => set({ isPaintMode: mode }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setCurrentZoom: (zoom) => set({
    currentZoom: zoom,
    canPaint: zoom >= 15
  }),
  setFocusedPixel: (pixel) => set({ focusedPixel: pixel }),
  setViewedPixel: (pixel) => set({ viewedPixel: pixel }),
}))

interface CommunityInfo {
  community: Community | null
  communitySetAt: Date | null
  canChange: boolean
  daysRemaining: number
}

interface CommunityStore {
  communityInfo: CommunityInfo | null
  isLoading: boolean
  error: Error | null
  fetchAttempts: number
  setCommunityInfo: (info: CommunityInfo | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: Error | null) => void
  incrementFetchAttempts: () => void
  resetFetchAttempts: () => void
}

export const useCommunityStore = create<CommunityStore>((set) => ({
  communityInfo: null,
  isLoading: false,
  error: null,
  fetchAttempts: 0,
  setCommunityInfo: (info) => set({ communityInfo: info, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  incrementFetchAttempts: () => set((state) => ({ fetchAttempts: state.fetchAttempts + 1 })),
  resetFetchAttempts: () => set({ fetchAttempts: 0 }),
}))