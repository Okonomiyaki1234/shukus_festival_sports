"use client";
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Supabase Storageの画像URL生成
  const getImageUrl = (filename: string) => {
    if (!filename) return "";
    const { data } = supabase.storage.from("slides").getPublicUrl(filename);
    return data.publicUrl;
  };

const effects = [
  { value: "fade", label: "フェード" },
  { value: "slide-right", label: "右からスライドイン" },
  { value: "slide-bottom", label: "下からスライドイン" },
  { value: "flash", label: "フラッシュ" },
  { value: "none", label: "演出なし" },
];

export default function MainPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState("none");
  // 得点表示/非表示は子画面用。親画面では常に表示。
  const [scoreVisible, setScoreVisible] = useState(true);
  // 入力値管理
  const [scoreInputs, setScoreInputs] = useState<{ [teamId: string]: string }>({});

  // 初回データ取得
  useEffect(() => {
    const fetchAll = async () => {
      const { data: teamData } = await supabase.from("teams").select();
      setTeams(teamData ?? []);
      const { data: slideData } = await supabase.from("slides").select().order("order");
      setSlides(slideData ?? []);
      const { data: scoreData } = await supabase.from("scores").select();
      setScores(scoreData ?? []);
      // スライド状態取得
      const { data: slideState } = await supabase.from("slide_state").select().eq("id", 1).single();
      if (slideState && slideData) {
        const idx = slideData.findIndex((s: any) => s.id === slideState.current_slide);
        setSlideIdx(idx >= 0 ? idx : 0);
      }
      // 得点表示状態取得
      const { data: scoreState } = await supabase.from("score_state").select().eq("id", 1).single();
      if (scoreState) setScoreVisible(scoreState.visible);
    };
    fetchAll();
  }, []);


  // スライド送り時にDBも確実に更新
  const handlePrev = async () => {
    if (slideIdx > 0 && slides[slideIdx - 1]) {
      const newIdx = slideIdx - 1;
      await supabase.from("slide_state").update({ current_slide: slides[newIdx].id }).eq("id", 1);
      setSlideIdx(newIdx);
    }
  };
  const handleNext = async () => {
    if (slideIdx < slides.length - 1 && slides[slideIdx + 1]) {
      const newIdx = slideIdx + 1;
      await supabase.from("slide_state").update({ current_slide: slides[newIdx].id }).eq("id", 1);
      setSlideIdx(newIdx);
    }
  };

  // 演出変更時にDBも更新
  const handleEffectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedEffect(value);
    if (slides[slideIdx]) {
      await supabase.from("slide_state").update({ effect: value }).eq("id", 1);
    }
  };

  // 入力値変更
  const handleScoreInput = (teamId: string, value: string) => {
    setScoreInputs((prev) => ({ ...prev, [teamId]: value }));
  };

  // 一括決定ボタンで全チーム加算/減算＋DB反映
  const handleScoreApplyAll = async () => {
    setScores((prev) => {
      prev.forEach(async (s) => {
        const input = scoreInputs[s.team_id];
        const diff = Number(input);
        if (!isNaN(diff) && input !== "") {
          const newScore = s.score + diff;
          await supabase.from("scores").update({ score: newScore }).eq("team_id", s.team_id);
        }
      });
      return prev.map((s) => {
        const input = scoreInputs[s.team_id];
        const diff = Number(input);
        if (!isNaN(diff) && input !== "") {
          return { ...s, score: s.score + diff };
        }
        return s;
      });
    });
    setScoreInputs({});
  };

  const handleScoreVisible = () => setScoreVisible((v) => !v);


  // 新方式: 重ねレイヤー演出リスト
  const overlayEffects = [
    { type: "fever", label: "フィーバー演出" },
    { type: "warning", label: "警告" },
    { type: "sakura", label: "桜吹雪" },
    { type: "fuurin", label: "短冊付き風鈴" },
    { type: "koyo", label: "紅葉の風" },
    { type: "snow", label: "雪の結晶" },
    { type: "hanabi", label: "花火" },
    { type: "kirakira", label: "キラキラ" },
    { type: "bakuhatsu", label: "爆発" },
    { type: "confetti", label: "紙吹雪" },
    { type: "star", label: "スター" },
    { type: "rainbow", label: "虹" },
    { type: "lightning", label: "雷" },
    { type: "heart", label: "ハート" },
    { type: "clap", label: "拍手" },
  ];

  // 選択中のoverlay effect
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [isFiring, setIsFiring] = useState(false);

  // 発動ボタン押下時: id='singleton-overlay'でUPSERT
  const handleOverlayFire = async () => {
    if (!selectedOverlay) return;
    setIsFiring(true);
    // id固定値でUPSERT（なければINSERT, あればUPDATE）
    const id = 'singleton-overlay';
    const { error } = await supabase.from("overlay_effects").upsert([
      {
        id,
        effect_type: selectedOverlay,
        consumed: false,
        requested_at: new Date().toISOString(),
      }
    ], { onConflict: 'id' });
    setIsFiring(false);
  };

  return (
    <div className="min-h-screen bg-green-50 dark:bg-zinc-900 p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">親画面（操作パネル）</h1>
      <div className="mb-6 flex gap-4">
        <a
          href="/child"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          子画面を新しいタブで開く
        </a>
        <a
          href="/slides"
          className="inline-block px-6 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600 transition"
        >
          スライド設定ページへ
        </a>
      </div>
      {/* 重ねレイヤー演出 選択→発動方式 */}
      <div className="mb-8 flex flex-col gap-3 w-full max-w-2xl">
        <div className="flex flex-wrap gap-3">
          {overlayEffects.map(e => (
            <button
              key={e.type}
              onClick={() => setSelectedOverlay(e.type)}
              className={`px-4 py-2 rounded shadow text-sm transition ${selectedOverlay === e.type ? 'bg-pink-700 text-white font-bold scale-105' : 'bg-pink-200 text-pink-900 hover:bg-pink-400'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleOverlayFire}
          className={`mt-2 px-6 py-2 rounded font-bold shadow transition ${selectedOverlay ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'}`}
          disabled={!selectedOverlay || isFiring}
        >
          {isFiring ? '発動中...' : '発動'}
        </button>
      </div>
      {/* スライド操作 */}
      <div className="flex gap-8 items-center mb-8">
        {/* 前スライドプレビュー */}
        <div className="w-24 h-16 bg-zinc-200 flex items-center justify-center text-xs">
          {slides[slideIdx - 1]?.filename ? (
            <img
              src={getImageUrl(slides[slideIdx - 1].filename)}
              alt="prev"
              className="w-full h-full object-contain"
            />
          ) : "-"}
        </div>
        <button onClick={handlePrev} className="px-4 py-2 bg-zinc-400 rounded text-white">前へ</button>
        {/* 現在スライド */}
        <div className="w-40 h-24 bg-zinc-300 flex items-center justify-center font-bold text-lg border-2 border-green-600">
          {slides[slideIdx]?.filename ? (
            <img
              src={getImageUrl(slides[slideIdx].filename)}
              alt="current"
              className="w-full h-full object-contain"
            />
          ) : "-"}
        </div>
        <button onClick={handleNext} className="px-4 py-2 bg-green-600 rounded text-white">次へ</button>
        {/* 次スライドプレビュー */}
        <div className="w-24 h-16 bg-zinc-200 flex items-center justify-center text-xs">
          {slides[slideIdx + 1]?.filename ? (
            <img
              src={getImageUrl(slides[slideIdx + 1].filename)}
              alt="next"
              className="w-full h-full object-contain"
            />
          ) : "-"}
        </div>
      </div>

      {/* 演出選択 */}
      <div className="mb-8 flex gap-4 items-center">
        <label className="font-semibold">演出：</label>
        <select value={selectedEffect} onChange={handleEffectChange} className="px-2 py-1 rounded border">
          {effects.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <span className="text-zinc-500">（子画面で個別アニメーション）</span>
      </div>

      {/* 得点操作 */}
      <div className="mb-8 w-full max-w-lg">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">得点操作</span>
          <span className="text-zinc-500 text-sm">（得点表示/非表示は子画面用）</span>
        </div>
        <table className="w-full border">
          <thead>
            <tr className="bg-zinc-100">
              <th className="p-2">チーム</th>
              <th className="p-2">現在の得点</th>
              <th className="p-2">加算/減算値</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const score = scores.find((s: any) => s.team_id === team.id)?.score ?? 0;
              return (
                <tr key={team.id}>
                  <td className="p-2" style={{ color: team.color }}>{team.name}</td>
                  <td className="p-2 text-center">{score}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={scoreInputs[team.id] ?? ""}
                      onChange={e => handleScoreInput(team.id, e.target.value)}
                      className="border rounded px-2 py-1 w-20 text-right"
                      placeholder="例: 10"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-end mt-2">
          <button
            onClick={handleScoreApplyAll}
            className="px-5 py-2 bg-green-700 text-white rounded disabled:bg-zinc-400"
            disabled={Object.values(scoreInputs).every((v) => v === undefined || v === "")}
          >全チーム一括決定</button>
        </div>
      </div>
    </div>
  );
}
