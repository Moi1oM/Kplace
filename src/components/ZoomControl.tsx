"use client";

export default function ZoomControls() {
  const handleZoomIn = () => {
    const event = new CustomEvent("mapZoomIn");
    window.dispatchEvent(event);
  };

  const handleZoomOut = () => {
    const event = new CustomEvent("mapZoomOut");
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center text-gray-700 font-bold text-lg transition-colors duration-200"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center text-gray-700 font-bold text-lg transition-colors duration-200"
      >
        −
      </button>
    </div>
  );
}
