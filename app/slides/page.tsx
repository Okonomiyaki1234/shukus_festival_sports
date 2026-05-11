"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SlidesSettingPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [order, setOrder] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Supabase Storageの画像URL生成
  const getImageUrl = (filename: string) => {
    if (!filename) return "";
    const { data } = supabase.storage.from("slides").getPublicUrl(filename);
    return data.publicUrl;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // スライド一覧・画像一覧取得
  useEffect(() => {
    fetchSlides();
    fetchImages();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("slides").select().order("order");
    if (error) setError(error.message);
    setSlides(data ?? []);
    setLoading(false);
  };

  // 画像一覧取得
  const fetchImages = async () => {
    const { data, error } = await supabase.storage.from("slides").list();
    if (!error && data) {
      setUploadedImages(data.filter((f: any) => f.name).map((f: any) => f.name));
    }
  };

  // 画像アップロード
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    const file = files[0];
    const { error } = await supabase.storage.from("slides").upload(file.name, file, { upsert: true });
    if (error) setError(error.message);
    else await fetchImages();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 追加
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("画像を選択してください");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.from("slides").insert({ filename: selectedImage, "order": order });
    if (error) setError(error.message);
    setSelectedImage("");
    setOrder(1);
    await fetchSlides();
    setLoading(false);
  };

  // 削除
  const handleDelete = async (id: string) => {
    setLoading(true);
    setError("");
    await supabase.from("slides").delete().eq("id", id);
    await fetchSlides();
    setLoading(false);
  };

  // 順番入れ替え（上/下）
  const handleMove = async (idx: number, direction: "up" | "down") => {
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === slides.length - 1)) return;
    setLoading(true);
    setError("");
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const slideA = slides[idx];
    const slideB = slides[swapIdx];
    // order値を入れ替え
    await supabase.from("slides").update({ "order": slideB.order }).eq("id", slideA.id);
    await supabase.from("slides").update({ "order": slideA.order }).eq("id", slideB.id);
    await fetchSlides();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-8 flex flex-col items-center">
      <div className="flex w-full max-w-2xl justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">スライド設定</h1>
        <a
          href="/main"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          メインページへ戻る
        </a>
      </div>
      {/* 画像アップロード */}
      <div className="flex gap-4 mb-4 items-center">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading && <span className="text-zinc-500">アップロード中...</span>}
      </div>
      {/* 画像選択＋追加 */}
      <form onSubmit={handleAdd} className="flex gap-4 mb-8 items-center">
        <select
          value={selectedImage}
          onChange={e => setSelectedImage(e.target.value)}
          className="border rounded px-3 py-2 min-w-[180px]"
          required
        >
          <option value="">画像を選択</option>
          {uploadedImages.map((img) => (
            <option key={img} value={img}>{img}</option>
          ))}
        </select>
        {/* 選択画像プレビュー */}
        {selectedImage && (
          <img
            src={getImageUrl(selectedImage)}
            alt="preview"
            className="w-24 h-16 object-contain border bg-white"
          />
        )}
        <input
          type="number"
          value={order}
          onChange={e => setOrder(Number(e.target.value))}
          placeholder="順番"
          className="border rounded px-3 py-2 w-24"
          required
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={loading}>
          追加
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <table className="w-full max-w-2xl border mb-8">
        <thead>
          <tr className="bg-zinc-100">
            <th className="p-2">画像</th>
            <th className="p-2">画像ファイル名</th>
            <th className="p-2">順番</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {slides.map((slide, idx) => (
            <tr key={slide.id}>
              <td className="p-2">
                <img
                  src={getImageUrl(slide.filename)}
                  alt={slide.filename}
                  className="w-24 h-16 object-contain border bg-white"
                />
              </td>
              <td className="p-2">{slide.filename}</td>
              <td className="p-2 text-center">{slide.order}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => handleMove(idx, "up")}
                  className="px-2 py-1 bg-zinc-400 text-white rounded disabled:bg-zinc-200"
                  disabled={loading || idx === 0}
                >↑</button>
                <button
                  onClick={() => handleMove(idx, "down")}
                  className="px-2 py-1 bg-zinc-400 text-white rounded disabled:bg-zinc-200"
                  disabled={loading || idx === slides.length - 1}
                >↓</button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                  disabled={loading}
                >削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-zinc-500 text-sm">画像ファイル自体はSupabase Storage（slidesバケット）にアップロードしてください。</div>
    </div>
  );
}
