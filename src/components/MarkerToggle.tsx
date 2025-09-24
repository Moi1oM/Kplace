"use client";

import { useState } from "react";

export default function MarkerToggle() {
  const [markersVisible, setMarkersVisible] = useState(true);

  const handleToggleMarkers = () => {
    const newVisibility = !markersVisible;
    setMarkersVisible(newVisibility);

    const event = new CustomEvent("toggleMarkers", {
      detail: { visible: newVisibility },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={handleToggleMarkers}
        className="w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-lg flex items-center justify-center text-gray-700 transition-colors duration-200"
        title={markersVisible ? "Hide markers" : "Show markers"}
      >
        {markersVisible ? (
          // 마커 아이콘 (보이는 상태)
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        ) : (
          // 숨겨진 마커 아이콘 (숨긴 상태)
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="opacity-50"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            <line
              x1="2"
              y1="2"
              x2="22"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
