// OGP画像(SNSでシェアされた時に表示されるサムネイル)生成用のユーティリティ。
// 画像生成エンジン(Satori)は日本語フォントを内蔵していないため、
// 使う文字だけを含む軽量なフォントデータをGoogle Fontsから取得する。
export async function loadJapaneseFont(text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();

  // User-Agentを付けずに取得するとTTF形式のURLが返る(SatoriはWOFF2非対応のため)。
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) {
    throw new Error("フォントの取得に失敗しました");
  }

  const fontResponse = await fetch(match[1]);
  return fontResponse.arrayBuffer();
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
