import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

// マップページの「住所・駅名で検索」用。ブラウザから直接Nominatimを呼ぶと
// CORSや利用規約(User-Agent必須)の問題があるため、サーバー経由にする。
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "検索キーワードを入力してください。" }, { status: 400 });
  }

  const result = await geocodeAddress(query);

  if (!result) {
    return NextResponse.json({ error: "見つかりませんでした。別のキーワードでお試しください。" }, { status: 404 });
  }

  return NextResponse.json(result);
}
