"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";


export default function ChildPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [effect, setEffect] = useState("none");
  const [slideEffect, setSlideEffect] = useState("none"); // スライド切り替え時のみ発動用
  const prevSlideId = useRef<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const [overlay, setOverlay] = useState<{ id: string, type: string } | null>(null);
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 重ねレイヤー演出リスト
  const overlayEffectsList = [
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

  // データ取得関数
  const fetchAll = async () => {
    const { data: teamData } = await supabase.from("teams").select();
    setTeams(teamData ?? []);
    const { data: slideData } = await supabase.from("slides").select().order("order");
    setSlides(slideData ?? []);
    const { data: scoreData } = await supabase.from("scores").select();
    setScores(scoreData ?? []);
    // スライド状態取得
    const { data: slideState } = await supabase.from("slide_state").select().eq("id", 1).single();
    if (slideState) {
      setEffect(slideState.effect ?? "none"); // 現在のeffect値は保持
      // スライドIDが変わった時だけeffectを発動
      if (slideState.current_slide !== prevSlideId.current) {
        setSlideEffect(slideState.effect ?? "none");
        setCurrentSlideId(slideState.current_slide);
        prevSlideId.current = slideState.current_slide;
      } else {
        setCurrentSlideId(slideState.current_slide);
        setSlideEffect("none"); // effect切替時は発動しない
      }
    }
    // 得点表示状態取得
    const { data: scoreState } = await supabase.from("score_state").select().eq("id", 1).single();
    if (scoreState) setScoreVisible(scoreState.visible);
  };

  // 初回取得＋Realtime購読
  // スライド・得点同期用購読
  useEffect(() => {
    fetchAll();
    const channel = supabase.channel('child-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slide_state' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'score_state' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, fetchAll)
      .subscribe();
    subscriptionRef.current = channel;
    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // overlay_effects: id='singleton-overlay'のみ監視・発動（必ずselectで最新値を取得して判定）
  useEffect(() => {
    // 発動＆消費処理
    const checkAndFireOverlay = async () => {
      const { data, error } = await supabase.from('overlay_effects').select().eq('id', 'singleton-overlay').single();
      if (error || !data) return;
      if (data.consumed === false) {
        setOverlay({ id: data.id, type: data.effect_type });
        if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = setTimeout(async () => {
          setOverlay(null);
          try {
            const { error } = await supabase.from("overlay_effects").update({ consumed: true }).eq("id", data.id);
            if (error) {
              console.error('[overlay_effects] consumed update error:', error);
            }
          } catch (err) {
            console.error('[overlay_effects] consumed update exception:', err);
          }
        }, 3000);
      }
      // consumed=trueのときはsetOverlay(null)を呼ばず何もしない（消しすぎ防止）
    };

    // サブスクライブでイベントが来たら必ず最新値をselectして判定
    const overlayChannel = supabase.channel('overlay-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'overlay_effects', filter: 'id=eq.singleton-overlay' }, checkAndFireOverlay)
      .subscribe();

    // 初回マウント時にも必ず判定
    checkAndFireOverlay();

    return () => {
      supabase.removeChannel(overlayChannel);
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, []);

  // 得点を降順でソート
  const sortedTeams = [...teams].sort((a, b) => {
    const sa = scores.find((s: any) => s.team_id === a.id)?.score ?? 0;
    const sb = scores.find((s: any) => s.team_id === b.id)?.score ?? 0;
    return sb - sa;
  });

  // 現在スライドの画像URL取得
  const getImageUrl = (filename: string) => {
    if (!filename) return "";
    const { data } = supabase.storage.from("slides").getPublicUrl(filename);
    return data.publicUrl;
  };
  const currentSlide = slides.find((s) => s.id === currentSlideId);

  // スライド切り替え時のみeffectを発動
  const getSlideMotion = () => {
    switch (slideEffect) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.6 }
        };
      case "slide-right":
        return {
          initial: { x: 200, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -200, opacity: 0 },
          transition: { duration: 0.5 }
        };
      case "slide-bottom":
        return {
          initial: { y: 200, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: -200, opacity: 0 },
          transition: { duration: 0.5 }
        };
      case "flash":
        return {
          initial: { opacity: 0 },
          animate: { opacity: [0, 1, 0.2, 1] },
          exit: { opacity: 0 },
          transition: { duration: 0.7 }
        };
      default:
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 }
        };
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      {/* スライド画像（アニメーション付き） */}
      <div className="w-[640px] h-[360px] bg-zinc-800 flex items-center justify-center text-white text-2xl font-bold mb-8 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {currentSlide ? (
            <motion.img
              key={currentSlide.id}
              src={getImageUrl(currentSlide.filename)}
              alt={currentSlide.filename}
              className="w-full h-full object-contain"
              {...getSlideMotion()}
            />
          ) : (
            <motion.span key="none" {...getSlideMotion()}>スライドなし</motion.span>
          )}
        </AnimatePresence>
        {/* オーバーレイ演出レイヤー（z-50で最前面に） */}
        <AnimatePresence>
          {overlay && (
            <motion.div
              key={overlay.id + overlay.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
            >
              <span className="text-5xl font-bold text-white drop-shadow-lg bg-black/40 rounded px-8 py-4 animate-pulse">
                {overlayEffectsList.find(e => e.type === overlay.type)?.label || overlay.type}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* 得点表示（順位順） */}
      {scoreVisible && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/90 rounded shadow px-8 py-4 flex gap-8">
          {sortedTeams.map((team) => {
            const score = scores.find((s) => s.team_id === team.id)?.score ?? 0;
            return (
              <div key={team.id} className="flex flex-col items-center" style={{ color: team.color }}>
                <span className="font-bold text-lg">{team.name}</span>
                <span className="text-2xl font-mono">{score}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* 演出（ダミー） */}
      {effect !== "none" && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          演出: {effect}
        </div>
      )}
    </div>
  );
}
