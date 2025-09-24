"use client";

import Map from "@/components/Map";

export default function Home() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            서울시청 위치
          </h1>
          <p className="text-gray-600">
            네이버 지도 API v3를 이용한 서울특별시청 위치 표시
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📍 서울특별시청
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Map width="100%" height="400px" zoom={16} />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">주소</h3>
                  <p className="text-gray-600">
                    서울특별시 중구 세종대로 110 (태평로1가)
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">좌표</h3>
                  <p className="text-gray-600">
                    위도: 37.5663°N
                    <br />
                    경도: 126.9779°E
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">교통</h3>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• 지하철 1호선, 2호선 시청역</li>
                    <li>• 지하철 5호선 광화문역</li>
                    <li>• 버스 정류장: 시청 앞, 덕수궁</li>
                  </ul>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>팁:</strong> 마커를 클릭하면 상세 정보를 볼 수
                    있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 모바일에서 지도 높이 조정 */}
            <div className="block md:hidden mt-6">
              <Map width="100%" height="300px" zoom={15} />
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>네이버 지도 API v3 사용 | Maps © NAVER Corp.</p>
        </footer>
      </div>
    </main>
  );
}
