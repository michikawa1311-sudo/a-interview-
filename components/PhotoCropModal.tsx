"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

// 顔写真の切り取り位置を選ぶモーダル。
// ドラッグで位置、スライダー(またはピンチ)で拡大率を調整し、
// 「この位置で切り取る」を押すと正方形に切り抜いた画像(Blob)を返す。
// 切り抜いた画像をアップロードするため、表示側は円形にくり抜くだけで済む。
export default function PhotoCropModal({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  // このモーダルはファイル選択のたびにマウントし直されるため、
  // 画像URLは初回描画時に一度だけ生成し、閉じるときに解放する。
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  async function handleConfirm() {
    if (!imageUrl || !croppedArea || isProcessing) return;
    setIsProcessing(true);

    const image = new Image();
    image.src = imageUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    // 大きすぎる画像はプロフィール表示に不要なため、最大600pxに縮小して書き出す。
    const outputSize = Math.min(600, Math.round(croppedArea.width));
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(
      image,
      croppedArea.x,
      croppedArea.y,
      croppedArea.width,
      croppedArea.height,
      0,
      0,
      outputSize,
      outputSize
    );

    canvas.toBlob(
      (blob) => {
        setIsProcessing(false);
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h3 className="mb-1 text-base font-bold text-gray-900">写真の位置を調整</h3>
        <p className="mb-4 text-xs text-gray-500">
          ドラッグで位置を動かし、スライダーで拡大できます。円の中に入る部分が掲載されます。
        </p>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-gray-900">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, areaPixels) => setCroppedArea(areaPixels)}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gray-500">拡大</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedArea}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isProcessing ? "処理中..." : "この位置で切り取る"}
          </button>
        </div>
      </div>
    </div>
  );
}
