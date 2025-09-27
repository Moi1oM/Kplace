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

export async function getRegionFromCoords(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const response = await fetch(
      `/api/reverse-geocode?lat=${lat}&lng=${lng}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch region');
    }

    const data = await response.json();

    if (!data.area1Name) {
      return '위치 정보 없음';
    }

    return getRegionCategory(data.area1Name);
  } catch (error) {
    console.error('Failed to get region:', error);
    return '위치 정보 없음';
  }
}