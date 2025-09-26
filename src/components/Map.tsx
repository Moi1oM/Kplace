"use client";

import {
  useEffect,
  useRef,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { usePixelStore } from "@/lib/store";

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
  children?: React.ReactNode;
}

const Map = memo(
  forwardRef<any, MapProps>(function Map(
    {
      width = "100%",
      height = "400px",
      zoom = 10,
      center = { lat: 37.5663, lng: 126.9779 },
      markers = [],
      children,
    },
    ref
  ) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersArrayRef = useRef<any[]>([]);
    const infoWindowsArrayRef = useRef<any[]>([]);
    const isInitializedRef = useRef(false);
    const setCurrentZoom = usePixelStore((state) => state.setCurrentZoom);

    // 마커 업데이트 함수
    const updateMarkers = useCallback((newMarkers: MarkerData[]) => {
      if (!mapInstanceRef.current || !window.naver?.maps) return;

      // 기존 마커 제거
      markersArrayRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      infoWindowsArrayRef.current.forEach((infoWindow) => {
        infoWindow.close();
      });
      markersArrayRef.current = [];
      infoWindowsArrayRef.current = [];

      // 새 마커 생성
      newMarkers.forEach((markerData, index) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            markerData.lat,
            markerData.lng
          ),
          map: mapInstanceRef.current,
          title: markerData.title || `Marker ${index + 1}`,
        });

        markersArrayRef.current.push(marker);

        if (markerData.content) {
          const infoWindow = new window.naver.maps.InfoWindow({
            content: markerData.content,
          });

          infoWindowsArrayRef.current.push(infoWindow);

          window.naver.maps.Event.addListener(marker, "click", function () {
            infoWindowsArrayRef.current.forEach((iw) => iw.close());
            if (infoWindow.getMap()) {
              infoWindow.close();
            } else {
              infoWindow.open(mapInstanceRef.current, marker);
            }
          });
        }
      });
    }, []);

    // 이벤트 핸들러들
    const handleToggleMarkers = useCallback((event: any) => {
      const visible = event.detail.visible;
      markersArrayRef.current.forEach((marker) => {
        if (visible) {
          marker.setMap(mapInstanceRef.current);
        } else {
          marker.setMap(null);
          infoWindowsArrayRef.current.forEach((iw) => iw.close());
        }
      });
    }, []);

    const handleZoomIn = useCallback(() => {
      if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom();
        mapInstanceRef.current.setZoom(currentZoom + 1, true);
      }
    }, []);

    const handleZoomOut = useCallback(() => {
      if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom();
        mapInstanceRef.current.setZoom(currentZoom - 1, true);
      }
    }, []);

    const handleZoomToPixels = useCallback(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(12, true);
      }
    }, []);

    // Expose map instance and utility functions via ref
    useImperativeHandle(
      ref,
      () => ({
        getMapInstance: () => mapInstanceRef.current,
        getCenter: () => mapInstanceRef.current?.getCenter(),
        getZoom: () => mapInstanceRef.current?.getZoom(),
        getBounds: () => mapInstanceRef.current?.getBounds(),
        getProjection: () => mapInstanceRef.current?.getProjection(),
        fromLatLngToPoint: (lat: number, lng: number) => {
          if (!mapInstanceRef.current || !window.naver?.maps) return null;
          const projection = mapInstanceRef.current.getProjection();
          const latLng = new window.naver.maps.LatLng(lat, lng);
          return projection.fromCoordToOffset(latLng);
        },
        fromPointToLatLng: (x: number, y: number) => {
          if (!mapInstanceRef.current || !window.naver?.maps) return null;
          const projection = mapInstanceRef.current.getProjection();
          const point = new window.naver.maps.Point(x, y);
          return projection.fromOffsetToCoord(point);
        },
      }),
      []
    );

    // 지도 초기화 - 한 번만 실행
    useEffect(() => {
      if (isInitializedRef.current) return;

      // 인증 실패 처리 함수 정의
      window.navermap_authFailure = function () {
        console.error(
          "네이버 지도 API 인증에 실패했습니다. 클라이언트 ID를 확인해주세요."
        );
        alert(
          "네이버 지도 API 인증에 실패했습니다. 클라이언트 ID를 확인해주세요."
        );
      };

      const initMap = () => {
        if (
          !window.naver?.maps ||
          !mapRef.current ||
          isInitializedRef.current
        ) {
          return;
        }

        // 지도 옵션
        const mapOptions = {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom: zoom,
          mapTypeControl: false,
          zoomControl: false,
          logoControl: false,
          mapDataControl: false,
          scaleControl: false,
        };

        // 지도 생성
        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;
        isInitializedRef.current = true;

        // 초기 줌 레벨 설정
        setCurrentZoom(zoom);

        // 줌 레벨 변경 이벤트 리스너
        window.naver.maps.Event.addListener(map, "zoom_changed", function () {
          const newZoom = map.getZoom();
          if (process.env.NODE_ENV === 'development') {
            console.log('[Map Debug] Zoom changed:', newZoom);
          }
          setCurrentZoom(newZoom);
        });

        // 지도 이동 완료 이벤트 리스너
        window.naver.maps.Event.addListener(map, "idle", function () {
          window.dispatchEvent(
            new CustomEvent("mapMoved", {
              detail: {
                center: map.getCenter(),
                bounds: map.getBounds(),
                zoom: map.getZoom(),
              },
            })
          );
        });

        // 초기 마커 생성
        updateMarkers(markers);

        // 이벤트 리스너 등록
        window.addEventListener("toggleMarkers", handleToggleMarkers);
        window.addEventListener("mapZoomIn", handleZoomIn);
        window.addEventListener("mapZoomOut", handleZoomOut);
        window.addEventListener("mapZoomToPixels", handleZoomToPixels);
      };

      // 네이버 지도 API 로드 확인
      const checkNaverMaps = setInterval(() => {
        if (window.naver?.maps) {
          clearInterval(checkNaverMaps);
          initMap();
        }
      }, 100);

      // Cleanup
      return () => {
        clearInterval(checkNaverMaps);
        window.removeEventListener("toggleMarkers", handleToggleMarkers);
        window.removeEventListener("mapZoomIn", handleZoomIn);
        window.removeEventListener("mapZoomOut", handleZoomOut);
        window.removeEventListener("mapZoomToPixels", handleZoomToPixels);
      };
    }, []); // 빈 의존성 배열 - 한 번만 실행

    // 마커 업데이트 - markers prop 변경 시에만 실행
    useEffect(() => {
      if (isInitializedRef.current && markers) {
        updateMarkers(markers);
      }
    }, [markers, updateMarkers]);

    // 지도 중심/줌 업데이트
    useEffect(() => {
      if (mapInstanceRef.current && isInitializedRef.current) {
        const currentCenter = mapInstanceRef.current.getCenter();
        const currentZoom = mapInstanceRef.current.getZoom();

        // 중심 위치가 변경된 경우만 업데이트
        if (
          Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
          Math.abs(currentCenter.lng() - center.lng) > 0.0001
        ) {
          mapInstanceRef.current.setCenter(
            new window.naver.maps.LatLng(center.lat, center.lng)
          );
        }

        // 줌 레벨이 변경된 경우만 업데이트
        if (currentZoom !== zoom) {
          mapInstanceRef.current.setZoom(zoom);
        }
      }
    }, [center.lat, center.lng, zoom]);

    return (
      <div className="relative" style={{ width, height }}>
        <div
          ref={mapRef}
          id="map"
          className="w-full h-full rounded-lg border border-gray-300 bg-slate-100"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
        {children}
      </div>
    );
  })
);

export default Map;
