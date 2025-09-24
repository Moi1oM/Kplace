"use client";

export default function ZoomToPixels() {
  const handleZoomToPixels = () => {
    const event = new CustomEvent("mapZoomToPixels");
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <button
        onClick={handleZoomToPixels}
        className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg hover:bg-opacity-100 transition-all duration-200"
      >
        <p className="text-sm text-gray-700 flex items-center gap-2">
          🔍 Zoom in to see the pixels
        </p>
      </button>
    </div>
  );
}
