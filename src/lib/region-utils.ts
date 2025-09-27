declare global {
  interface Window {
    naver: any;
  }
}

export function getRegionCategory(area1Name: string): string {
  if (area1Name.includes('서울')) return '서울시';
  if (area1Name.includes('경기')) return '경기도';
  if (
    area1Name.includes('충청') ||
    area1Name.includes('대전') ||
    area1Name.includes('세종')
  )
    return '충청권';
  if (area1Name.includes('강원')) return '강원권';
  if (
    area1Name.includes('경상') ||
    area1Name.includes('부산') ||
    area1Name.includes('대구') ||
    area1Name.includes('울산')
  )
    return '경상권';
  if (area1Name.includes('전라') || area1Name.includes('광주'))
    return '전라권';
  if (area1Name.includes('제주')) return '제주특별자치도';
  return '기타';
}

function waitForNaverMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.naver?.maps?.Service) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.naver?.maps?.Service) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });
}

export async function getRegionFromCoords(
  lat: number,
  lng: number
): Promise<string> {
  await waitForNaverMaps();

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.naver?.maps?.Service) {
      resolve('위치 정보 없음');
      return;
    }

    const latLng = new window.naver.maps.LatLng(lat, lng);

    window.naver.maps.Service.reverseGeocode(
      {
        coords: latLng,
        orders: window.naver.maps.Service.OrderType.ADDR,
      },
      (status: any, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          resolve('위치 정보 없음');
          return;
        }

        try {
          const result = response.v2.results[0];
          const area1Name = result.region.area1.name;
          const regionCategory = getRegionCategory(area1Name);
          resolve(regionCategory);
        } catch (error) {
          resolve('위치 정보 없음');
        }
      }
    );
  });
}