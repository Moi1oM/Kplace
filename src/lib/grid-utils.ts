export interface GridCoords {
  x: number;
  y: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export const KOREA_BOUNDS = {
  minLat: 33.0,
  maxLat: 39.0,
  minLng: 125.5,
  maxLng: 129.3,
};

export const GRID_WIDTH = 40000;
export const GRID_HEIGHT = 80000;

export function gridToLatLng(x: number, y: number): LatLng {
  const lat =
    KOREA_BOUNDS.minLat +
    (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat) * (1 - y / GRID_HEIGHT);
  const lng =
    KOREA_BOUNDS.minLng +
    (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng) * (x / GRID_WIDTH);
  return { lat, lng };
}

export function latLngToGrid(lat: number, lng: number): GridCoords {
  const x = Math.floor(
    ((lng - KOREA_BOUNDS.minLng) /
      (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng)) *
      GRID_WIDTH
  );
  const y = Math.floor(
    (1 -
      (lat - KOREA_BOUNDS.minLat) /
        (KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat)) *
      GRID_HEIGHT
  );
  return {
    x: Math.max(0, Math.min(GRID_WIDTH - 1, x)),
    y: Math.max(0, Math.min(GRID_HEIGHT - 1, y)),
  };
}