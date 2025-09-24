"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}

interface MapProps {
  width?: string;
  height?: string;
  zoom?: number;
}

export default function Map({
  width = "100%",
  height = "400px",
  zoom = 16,
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
        // 서울시청 좌표 (위도: 37.5663, 경도: 126.9779)
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5663, 126.9779),
          zoom: zoom,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.naver.maps.MapTypeControlStyle.BUTTON,
            position: window.naver.maps.Position.TOP_LEFT,
          },
          zoomControl: true,
          zoomControlOptions: {
            style: window.naver.maps.ZoomControlStyle.LARGE,
            position: window.naver.maps.Position.TOP_RIGHT,
          },
        };

        // 지도 생성
        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // 서울시청 마커 추가
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(37.5663, 126.9779),
          map: map,
          title: "서울시청",
        });

        // 정보창 추가
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding:10px; font-size:12px; line-height:1.5;">
              <strong>서울특별시청</strong><br/>
              서울특별시 중구 세종대로 110<br/>
              <small>Seoul City Hall</small>
            </div>
          `,
        });

        // 마커 클릭 시 정보창 표시
        window.naver.maps.Event.addListener(marker, "click", function () {
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
        });
      }
    };

    // 네이버 지도 API가 로드될 때까지 대기
    const checkNaverMaps = setInterval(() => {
      if (window.naver && window.naver.maps) {
        clearInterval(checkNaverMaps);
        initMap();
      }
    }, 100);

    return () => {
      clearInterval(checkNaverMaps);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
    };
  }, [zoom]);

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
