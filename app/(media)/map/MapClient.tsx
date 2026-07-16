"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { distanceKm, type GeocodeResult } from "@/lib/geocode";

// webpack環境ではLeafletのデフォルトマーカー画像のパス解決が壊れるため、
// CDN上の画像を明示的に指定する(定番の回避策)。
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type MapPost = {
  id: string;
  slug: string;
  title: string;
  trimmer_name: string;
  salon_name: string;
  area: string;
  nearest_station: string | null;
  photo_url: string | null;
  lat: number;
  lng: number;
};

const TOKYO_CENTER: [number, number] = [35.68, 139.65];

export default function MapClient({ posts }: { posts: MapPost[] }) {
  const [origin, setOrigin] = useState<GeocodeResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedPosts = useMemo(() => {
    if (!origin) return posts;
    return [...posts].sort(
      (a, b) => distanceKm(origin, { lat: a.lat, lng: a.lng }) - distanceKm(origin, { lat: b.lat, lng: b.lng })
    );
  }, [posts, origin]);

  function useCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("お使いのブラウザは現在地の取得に対応していません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setError("現在地を取得できませんでした。位置情報の利用を許可してください。");
      }
    );
  }

  async function searchByKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);

    const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearching(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "検索に失敗しました。");
      return;
    }

    const result = (await res.json()) as GeocodeResult;
    setOrigin(result);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white p-4 sm:flex-row sm:items-center">
        <form onSubmit={searchByKeyword} className="flex flex-1 gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="住所・最寄り駅で検索(例: 下高井戸駅)"
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isSearching ? "検索中..." : "検索"}
          </button>
        </form>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="rounded-full border border-amber-300 bg-white px-5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
        >
          現在地から探す
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {origin && (
        <p className="text-xs text-gray-500">
          この場所に近い順に並んでいます。
          <button type="button" onClick={() => setOrigin(null)} className="ml-2 underline hover:text-gray-700">
            並び順をリセット
          </button>
        </p>
      )}

      <div className="h-96 overflow-hidden rounded-xl border border-amber-100">
        <MapContainer
          center={origin ? [origin.lat, origin.lng] : TOKYO_CENTER}
          zoom={origin ? 14 : 12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {posts.map((post) => (
            <Marker key={post.id} position={[post.lat, post.lng]} icon={markerIcon}>
              <Popup>
                <p className="font-bold">{post.salon_name}</p>
                <p>{post.trimmer_name}さん</p>
                <Link href={`/trimmers/${post.slug}`} className="text-amber-700 underline">
                  記事を見る
                </Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <ul className="space-y-2">
        {sortedPosts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/trimmers/${post.slug}`}
              className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white p-4 transition hover:border-amber-300"
            >
              {post.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.photo_url}
                  alt={`${post.trimmer_name}さんの顔写真`}
                  className="h-12 w-12 shrink-0 rounded-full border border-amber-100 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">
                  🐶
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  {post.salon_name} / {post.trimmer_name}さん
                </p>
                <p className="text-xs text-gray-500">
                  {post.area}
                  {post.nearest_station ? ` ・ ${post.nearest_station.split("/")[0].trim()}` : ""}
                  {origin && ` ・ 現在地から約${distanceKm(origin, { lat: post.lat, lng: post.lng }).toFixed(1)}km`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
