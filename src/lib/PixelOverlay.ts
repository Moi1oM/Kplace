import { gridToLatLng, latLngToGrid, GRID_WIDTH, GRID_HEIGHT } from './grid-utils';

declare global {
  interface Window {
    naver: any;
  }
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface PixelOverlayOptions {
  pixels: Pixel[];
  isPaintMode: boolean;
  canPaint: boolean;
  selectedColor: string;
  currentZoom: number;
  minZoom: number;
  onPixelCreate?: (x: number, y: number, color: string) => void;
}

export function createPixelOverlay(options: PixelOverlayOptions) {
  if (typeof window === 'undefined' || !window.naver?.maps) {
    throw new Error('Naver Maps API is not loaded');
  }

  class PixelOverlay extends window.naver.maps.OverlayView {
  private _canvas: HTMLCanvasElement | null = null;
  private _hoverCanvas: HTMLCanvasElement | null = null;
  private _options: PixelOverlayOptions;
  private _lastHoverPos: { x: number; y: number } | null = null;
  private _pixelSizeCache: { zoom: number; size: number } | null = null;

  constructor(options: PixelOverlayOptions) {
    super();
    this._options = options;
  }

  onAdd() {
    const panes = this.getPanes();
    const overlayLayer = panes.overlayLayer;

    this._canvas = document.createElement('canvas');
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
    this._canvas.style.pointerEvents = 'none';
    overlayLayer.appendChild(this._canvas);

    this._hoverCanvas = document.createElement('canvas');
    this._hoverCanvas.style.position = 'absolute';
    this._hoverCanvas.style.top = '0';
    this._hoverCanvas.style.left = '0';
    this._hoverCanvas.style.pointerEvents = this._options.isPaintMode ? 'auto' : 'none';
    this._hoverCanvas.style.cursor = this._getCursor();
    overlayLayer.appendChild(this._hoverCanvas);

    this._hoverCanvas.addEventListener('click', this._handleClick);
    this._hoverCanvas.addEventListener('mousemove', this._handleMouseMove);
    this._hoverCanvas.addEventListener('mouseleave', this._handleMouseLeave);
  }

  draw() {
    if (!this._canvas || !this._hoverCanvas) return;

    const map = this.getMap();
    if (!map) return;

    const mapSize = map.getSize();

    this._canvas.width = mapSize.width;
    this._canvas.height = mapSize.height;
    this._hoverCanvas.width = mapSize.width;
    this._hoverCanvas.height = mapSize.height;

    this._drawPixels();
  }

  onRemove() {
    if (this._hoverCanvas) {
      this._hoverCanvas.removeEventListener('click', this._handleClick);
      this._hoverCanvas.removeEventListener('mousemove', this._handleMouseMove);
      this._hoverCanvas.removeEventListener('mouseleave', this._handleMouseLeave);

      const parent = this._hoverCanvas.parentNode;
      if (parent) {
        parent.removeChild(this._hoverCanvas);
      }
      this._hoverCanvas = null;
    }

    if (this._canvas) {
      const parent = this._canvas.parentNode;
      if (parent) {
        parent.removeChild(this._canvas);
      }
      this._canvas = null;
    }
  }

  updatePixels(pixels: Pixel[]) {
    this._options.pixels = pixels;
    this.draw();
  }

  updatePaintMode(isPaintMode: boolean, canPaint: boolean, selectedColor: string, currentZoom: number) {
    this._options.isPaintMode = isPaintMode;
    this._options.canPaint = canPaint;
    this._options.selectedColor = selectedColor;
    this._options.currentZoom = currentZoom;

    if (this._hoverCanvas) {
      this._hoverCanvas.style.pointerEvents = isPaintMode ? 'auto' : 'none';
      this._hoverCanvas.style.cursor = this._getCursor();
    }

    this.draw();
  }

  private _getCursor(): string {
    if (this._options.isPaintMode && this._options.canPaint) {
      return 'crosshair';
    } else if (this._options.isPaintMode && !this._options.canPaint) {
      return 'not-allowed';
    }
    return 'default';
  }

  private _getPixelSize(): number {
    const map = this.getMap();
    if (!map) return 1;

    const currentZoom = map.getZoom();

    if (this._pixelSizeCache && this._pixelSizeCache.zoom === currentZoom) {
      return this._pixelSizeCache.size;
    }

    const projection = this.getProjection();
    const center = map.getCenter();
    const { x: centerGridX, y: centerGridY } = latLngToGrid(center.lat(), center.lng());

    const safeGridX = Math.max(0, Math.min(GRID_WIDTH - 2, centerGridX));
    const safeGridY = Math.max(0, Math.min(GRID_HEIGHT - 2, centerGridY));

    const pixel1 = gridToLatLng(safeGridX, safeGridY);
    const pixel2 = gridToLatLng(safeGridX + 1, safeGridY);

    const latLng1 = new naver.maps.LatLng(pixel1.lat, pixel1.lng);
    const latLng2 = new naver.maps.LatLng(pixel2.lat, pixel2.lng);

    const point1 = projection.fromCoordToOffset(latLng1);
    const point2 = projection.fromCoordToOffset(latLng2);

    const pixelSpacing = Math.abs(point2.x - point1.x);
    const calculatedSize = Math.max(0.5, pixelSpacing * 0.95);

    this._pixelSizeCache = { zoom: currentZoom, size: calculatedSize };
    return calculatedSize;
  }

  private _drawPixels() {
    if (!this._canvas) return;

    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;

    const map = this.getMap();
    if (!map) return;

    const projection = this.getProjection();
    const bounds = map.getBounds();
    const pixelSize = this._getPixelSize();

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    if (this._options.isPaintMode && this._options.currentZoom >= this._options.minZoom) {
      this._drawGrid(ctx, bounds, projection, pixelSize);
    }

    this._options.pixels.forEach((pixel) => {
      const { lat, lng } = gridToLatLng(pixel.x, pixel.y);

      if (
        lat < bounds.getSW().lat() ||
        lat > bounds.getNE().lat() ||
        lng < bounds.getSW().lng() ||
        lng > bounds.getNE().lng()
      ) {
        return;
      }

      const latLng = new naver.maps.LatLng(lat, lng);
      const point = projection.fromCoordToOffset(latLng);

      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.strokeRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );
    });
  }

  private _drawGrid(ctx: CanvasRenderingContext2D, bounds: any, projection: any, pixelSize: number) {
    const topLeft = latLngToGrid(bounds.getNE().lat(), bounds.getSW().lng());
    const bottomRight = latLngToGrid(bounds.getSW().lat(), bounds.getNE().lng());

    const buffer = 2;
    const startX = Math.max(0, topLeft.x - buffer);
    const endX = Math.min(GRID_WIDTH - 1, bottomRight.x + buffer);
    const startY = Math.max(0, topLeft.y - buffer);
    const endY = Math.min(GRID_HEIGHT - 1, bottomRight.y + buffer);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    for (let gridX = startX; gridX <= endX; gridX++) {
      for (let gridY = startY; gridY <= endY; gridY++) {
        const { lat, lng } = gridToLatLng(gridX, gridY);
        const latLng = new naver.maps.LatLng(lat, lng);
        const point = projection.fromCoordToOffset(latLng);

        ctx.rect(
          point.x - pixelSize / 2,
          point.y - pixelSize / 2,
          pixelSize,
          pixelSize
        );
      }
    }

    ctx.stroke();
  }

  private _handleClick = (e: MouseEvent) => {
    if (!this._options.canPaint || !this._options.onPixelCreate) return;

    const projection = this.getProjection();
    const point = new naver.maps.Point(e.offsetX, e.offsetY);
    const latLng = projection.fromOffsetToCoord(point);

    const { x, y } = latLngToGrid(latLng.lat(), latLng.lng());
    this._options.onPixelCreate(x, y, this._options.selectedColor);
  };

  private _handleMouseMove = (e: MouseEvent) => {
    if (!this._options.isPaintMode || !this._hoverCanvas) return;

    const projection = this.getProjection();
    const point = new naver.maps.Point(e.offsetX, e.offsetY);
    const latLng = projection.fromOffsetToCoord(point);
    const { x, y } = latLngToGrid(latLng.lat(), latLng.lng());

    if (this._lastHoverPos && this._lastHoverPos.x === x && this._lastHoverPos.y === y) {
      return;
    }

    this._lastHoverPos = { x, y };
    this._drawHoverPreview(x, y);
  };

  private _handleMouseLeave = () => {
    if (this._hoverCanvas) {
      const ctx = this._hoverCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this._hoverCanvas.width, this._hoverCanvas.height);
      }
    }
    this._lastHoverPos = null;
  };

  private _drawHoverPreview(gridX: number, gridY: number) {
    if (!this._hoverCanvas) return;

    const ctx = this._hoverCanvas.getContext('2d');
    if (!ctx) return;

    const projection = this.getProjection();
    const pixelSize = this._getPixelSize();

    ctx.clearRect(0, 0, this._hoverCanvas.width, this._hoverCanvas.height);

    const { lat, lng } = gridToLatLng(gridX, gridY);
    const latLng = new naver.maps.LatLng(lat, lng);
    const point = projection.fromCoordToOffset(latLng);

    if (this._options.canPaint) {
      ctx.fillStyle = this._options.selectedColor + '30';
      ctx.fillRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );

      ctx.fillStyle = this._options.selectedColor + '80';
      const previewSize = pixelSize * 0.8;
      ctx.fillRect(
        point.x - previewSize / 2,
        point.y - previewSize / 2,
        previewSize,
        previewSize
      );

      ctx.strokeStyle = this._options.selectedColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );
    } else {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        point.x - pixelSize / 2,
        point.y - pixelSize / 2,
        pixelSize,
        pixelSize
      );
      ctx.setLineDash([]);
    }
  }
  }

  return new PixelOverlay(options);
}