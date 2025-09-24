"use client";

import Map from "@/components/Map";

export default function Home() {
  // 한국 주요 도청 마커 데이터
  const markers = [
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
    {
      lat: 37.2636,
      lng: 127.0286,
      title: "경기도청",
      content: `
        <div style="padding:10px; font-size:12px; line-height:1.5;">
          <strong>경기도청</strong><br/>
          경기도 수원시 영통구 도청로 30<br/>
          <small>Gyeonggi Provincial Office</small>
        </div>
      `,
    },
    {
      lat: 37.8813,
      lng: 127.7298,
      title: "강원도청",
      content: `
        <div style="padding:10px; font-size:12px; line-height:1.5;">
          <strong>강원특별자치도청</strong><br/>
          강원특별자치도 춘천시 중앙로 1<br/>
          <small>Gangwon Provincial Office</small>
        </div>
      `,
    },
    {
      lat: 36.5184,
      lng: 126.8,
      title: "충청남도청",
      content: `
        <div style="padding:10px; font-size:12px; line-height:1.5;">
          <strong>충청남도청</strong><br/>
          충청남도 홍성군 홍북읍 충남대로 21<br/>
          <small>Chungcheongnam-do Provincial Office</small>
        </div>
      `,
    },
    {
      lat: 35.7175,
      lng: 127.153,
      title: "전라북도청",
      content: `
        <div style="padding:10px; font-size:12px; line-height:1.5;">
          <strong>전북특별자치도청</strong><br/>
          전북특별자치도 전주시 완산구 효자로 225<br/>
          <small>Jeonbuk Provincial Office</small>
        </div>
      `,
    },
    {
      lat: 35.2538,
      lng: 128.6402,
      title: "경상남도청",
      content: `
        <div style="padding:10px; font-size:12px; line-height:1.5;">
          <strong>경상남도청</strong><br/>
          경상남도 창원시 의창구 중앙대로 300<br/>
          <small>Gyeongsangnam-do Provincial Office</small>
        </div>
      `,
    },
  ];

  return (
    <main className="w-screen h-screen overflow-hidden relative">
      {/* 전체화면 지도 */}
      <div className="w-full h-full">
        <Map
          width="100%"
          height="100vh"
          zoom={8}
          center={{ lat: 36.5, lng: 127.5 }}
          markers={markers}
        />
      </div>
    </main>
  );
}
