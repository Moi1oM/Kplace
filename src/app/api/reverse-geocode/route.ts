import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const apiKeyId = process.env.NEXT_PUBLIC_NAVERMAP_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_NAVERMAP_CLIENT_SECRET;

  if (!apiKeyId || !apiKey) {
    return NextResponse.json(
      { error: "API keys not configured" },
      { status: 500 }
    );
  }

  try {
    const coords = `${lng},${lat}`;
    const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${coords}&orders=admcode&output=json`;

    const response = await fetch(url, {
      headers: {
        "x-ncp-apigw-api-key-id": apiKeyId,
        "x-ncp-apigw-api-key": apiKey,
      },
    });

    if (!response.ok) {
      console.error(response);
      throw new Error(`Naver API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.status.code !== 0 || !data.results || data.results.length === 0) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const area1Name = data.results[0]?.region?.area1?.name;

    if (!area1Name) {
      return NextResponse.json(
        { error: "area1 name not found in response" },
        { status: 404 }
      );
    }

    return NextResponse.json({ area1Name });
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reverse geocode data" },
      { status: 500 }
    );
  }
}
