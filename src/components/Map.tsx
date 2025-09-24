"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}

interface MarkerData {
  lat: number;
  lng: number;
  title?: string;
  content?: string;
}

interface MapProps {
  width?: string;
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
  markers?: MarkerData[];
}

export default function Map({
  width = "100%",
  height = "400px",
  zoom = 10,
  center = { lat: 37.5663, lng: 126.9779 }, // 기본값: 서울시청
  markers = [
    {
      lat: 37.5663,
      lng: 126.9779,
      title: "서울시청",
      content: `
        <div style="padding:10px; font-size:12px; line-height:1.5;">
          <strong>서울특별시청</strong><br/>
          서울특별시 중구 세종대로 110<br/>
          <small>Seoul City Hall</small>
        </div>
      `,
    },
  ],
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // 인증 실패 처리 함수 정의
    window.navermap_authFailure = function () {
      console.error(
        "네이버 지도 API 인증에 실패했습니다. 클라이언트 ID를 확인해주세요.",
      );
      alert(
        "네이버 지도 API 인증에 실패했습니다. 클라이언트 ID를 확인해주세요.",
      );
    };

    const initMap = () => {
      if (window.naver && window.naver.maps && mapRef.current) {
        // 지도 중심점 설정
        const mapOptions = {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom: zoom,
          // 지도 타입 컨트롤 제거
          mapTypeControl: false,
          // 줌 컨트롤 제거
          zoomControl: false,
          // 로고 컨트롤 제거
          logoControl: false,
          // 맵 데이터 컨트롤 제거
          mapDataControl: false,
          // 축척 컨트롤 제거
          scaleControl: false,
        };

        // 지도 생성
        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // 마커들과 정보창들을 저장할 배열
        const markersArray: any[] = [];
        const infoWindowsArray: any[] = [];

        // 각 마커 데이터에 대해 마커와 정보창 생성
        markers.forEach((markerData, index) => {
          // 마커 생성
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(
              markerData.lat,
              markerData.lng,
            ),
            map: map,
            title: markerData.title || `Marker ${index + 1}`,
          });

          markersArray.push(marker);

          // 정보창 생성 (content가 있는 경우에만)
          if (markerData.content) {
            const infoWindow = new window.naver.maps.InfoWindow({
              content: markerData.content,
            });

            infoWindowsArray.push(infoWindow);

            // 마커 클릭 시 정보창 표시
            window.naver.maps.Event.addListener(marker, "click", function () {
              // 다른 모든 정보창 닫기
              infoWindowsArray.forEach((iw) => iw.close());

              // 현재 정보창 토글
              if (infoWindow.getMap()) {
                infoWindow.close();
              } else {
                infoWindow.open(map, marker);
              }
            });
          }
        });

        // 마커 토글 이벤트 리스너
        const handleToggleMarkers = (event: any) => {
          const visible = event.detail.visible;
          markersArray.forEach((marker) => {
            if (visible) {
              marker.setMap(map);
            } else {
              marker.setMap(null);
              // 마커가 숨겨질 때 정보창도 닫기
              infoWindowsArray.forEach((iw) => iw.close());
            }
          });
        };

        // 커스텀 줌 이벤트 리스너 추가
        const handleZoomIn = () => {
          if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            // 부드러운 줌인 애니메이션
            mapInstanceRef.current.setZoom(currentZoom + 1, true);
          }
        };

        const handleZoomOut = () => {
          if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom();
            // 부드러운 줌아웃 애니메이션
            mapInstanceRef.current.setZoom(currentZoom - 1, true);
          }
        };

        const handleZoomToPixels = () => {
          if (mapInstanceRef.current) {
            // 줌 레벨 12로 부드럽게 전환
            mapInstanceRef.current.setZoom(12, true);
          }
        };

        window.addEventListener("toggleMarkers", handleToggleMarkers);
        window.addEventListener("mapZoomIn", handleZoomIn);
        window.addEventListener("mapZoomOut", handleZoomOut);
        window.addEventListener("mapZoomToPixels", handleZoomToPixels);

        // cleanup 함수에서 이벤트 리스너 제거
        return () => {
          window.removeEventListener("toggleMarkers", handleToggleMarkers);
          window.removeEventListener("mapZoomIn", handleZoomIn);
          window.removeEventListener("mapZoomOut", handleZoomOut);
          window.removeEventListener("mapZoomToPixels", handleZoomToPixels);
        };
      }
    };

    // 네이버 지도 API가 로드될 때까지 대기
    const checkNaverMaps = setInterval(() => {
      if (window.naver && window.naver.maps) {
        clearInterval(checkNaverMaps);
        const cleanup = initMap();

        // cleanup 함수를 반환하여 useEffect cleanup에서 호출
        return cleanup;
      }
    }, 100);

    return () => {
      clearInterval(checkNaverMaps);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [zoom, center.lat, center.lng, markers]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        id="map"
        className="w-full rounded-lg border border-gray-300 bg-slate-100"
        style={{
          width: width,
          height: height,
        }}
      />
    </div>
  );
}
