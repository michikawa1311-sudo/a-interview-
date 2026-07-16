// 住所・駅名などの文字列を緯度経度に変換する(ジオコーディング)。
// 無料で使えるOpenStreetMapのNominatimサービスを利用する(APIキー不要)。
// 利用ポリシー上、リクエストは1秒に1回程度に抑え、識別可能なUser-Agentを付ける。
// https://operations.osmfoundation.org/policies/nominatim/

export type GeocodeResult = { lat: number; lng: number };

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(trimmed)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "A.Interview-UchinoTrimmerSan/1.0 (masa.ichikawa1311@gmail.com)",
      "Accept-Language": "ja",
    },
  });

  if (!res.ok) return null;

  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  if (!first) return null;

  return { lat: Number(first.lat), lng: Number(first.lon) };
}

// 2地点間の距離をkm単位で計算する(ハーバサイン公式)。
export function distanceKm(a: GeocodeResult, b: GeocodeResult): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
